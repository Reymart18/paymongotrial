import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import * as XLSX from 'xlsx';
import { PropertyAccount } from './property.entity';
import { FoxproBilling } from '../foxpro/foxpro-billing.entity';
import { FoxproPayment } from '../foxpro/foxpro-payment.entity';

export interface CreateHomeownerInput {
    neighborhood: string;
    block: string;
    lot: string;
    memberName: string;
    propertySizeSqm: number;
    classification: string;
    username: string;
    password: string;
}

interface MasterlistRecord {
    accountId: string;
    neighborhood: string;
    block: string;
    lot: string;
    memberName: string;
    propertySizeSqm?: number | null;
    classification: string;
    soa?: number | null;
}

@Injectable()
export class PropertyService {
    constructor(
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
        @InjectRepository(FoxproBilling)
        private billingRepo: Repository<FoxproBilling>,
        @InjectRepository(FoxproPayment)
        private paymentRepo: Repository<FoxproPayment>,
        private dataSource: DataSource,
    ) { }

    async createHomeowner(input: CreateHomeownerInput): Promise<PropertyAccount> {
        const accountId = `${input.neighborhood}${input.block}${input.lot}`;
        const hashedPassword = await bcrypt.hash(input.password, 10);
        const passwordChanged = input.password !== accountId;

        const homeowner = this.propertyRepo.create({
            accountId,
            neighborhood: input.neighborhood,
            block: input.block,
            lot: input.lot,
            memberName: input.memberName,
            propertySizeSqm: input.propertySizeSqm,
            classification: input.classification,
            username: input.username,
            password: hashedPassword,
            passwordChanged,
            balance: 0,
            status: 'active',
        });

        return this.propertyRepo.save(homeowner);
    }

    async uploadMasterlist(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const records = await this.parseMasterlistFile(file);
        const result = {
            inserted: 0,
            skipped: 0,
            errors: [] as string[],
        };

        await this.dataSource.transaction(async (manager) => {
            const propertyRepo = manager.getRepository(PropertyAccount);

            for (let index = 0; index < records.length; index += 1) {
                const record = records[index];
                const row = index + 1;

                if (!record.accountId || !record.memberName || !record.classification) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Missing accountId, memberName, or classification`);
                    continue;
                }

                const normalizedClass = this.normalizeClassification(record.classification);
                if (!normalizedClass) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Invalid classification (${record.classification})`);
                    continue;
                }

                const existing = await propertyRepo.findOne({
                    where: [
                        { accountId: record.accountId },
                        { username: record.accountId },
                    ],
                });

                if (existing) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: accountId or username already exists (${record.accountId})`);
                    continue;
                }

                const hashedPassword = await bcrypt.hash(record.accountId, 10);
                const propertySize =
                    record.propertySizeSqm !== undefined && record.propertySizeSqm !== null
                        ? Number(record.propertySizeSqm)
                        : null;

                const soaValue =
                    record.soa !== undefined && record.soa !== null
                        ? Number(record.soa)
                        : null;

                if (propertySize !== null && Number.isNaN(propertySize)) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Invalid propertySizeSqm`);
                    continue;
                }

                if (soaValue !== null && Number.isNaN(soaValue)) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Invalid soa`);
                    continue;
                }

                const homeowner = propertyRepo.create({
                    accountId: record.accountId,
                    neighborhood: record.neighborhood,
                    block: record.block,
                    lot: record.lot,
                    memberName: record.memberName,
                    propertySizeSqm: propertySize ?? undefined,
                    classification: normalizedClass,
                    soa: soaValue ?? undefined,
                    username: record.accountId,
                    password: hashedPassword,
                    passwordChanged: false,
                    balance: 0,
                    status: 'active',
                });

                await propertyRepo.save(homeowner);
                result.inserted += 1;
            }
        });

        return result;
    }

    async getByAccountId(accountId: string): Promise<PropertyAccount | null> {
        return this.propertyRepo.findOne({ where: { accountId } });
    }

    async changePassword(
        accountId: number,
        oldPassword: string,
        newPassword: string,
    ): Promise<void> {
        const account = await this.propertyRepo.findOne({ where: { id: accountId } });
        if (!account || !account.password) {
            throw new BadRequestException('Account not found');
        }

        const matches = await bcrypt.compare(oldPassword, account.password);
        if (!matches) {
            throw new BadRequestException('Current password is incorrect');
        }

        if (newPassword.trim().length < 6) {
            throw new BadRequestException('New password must be at least 6 characters');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        account.password = hashedPassword;
        account.passwordChanged = true;
        await this.propertyRepo.save(account);
    }

    async recalculateBalances(): Promise<{ updated: number }> {
        return this.dataSource.transaction(async (manager) => {
            const propertyRepo = manager.getRepository(PropertyAccount);
            const billingRepo = manager.getRepository(FoxproBilling);
            const paymentRepo = manager.getRepository(FoxproPayment);

            const billingSums = await billingRepo
                .createQueryBuilder('billing')
                .select('billing.accountId', 'accountId')
                .addSelect('SUM(billing.prinBal)', 'totalPriorDue')
                .addSelect('SUM(billing.intBal)', 'totalPriorInterest')
                .addSelect('SUM(billing.penBal)', 'totalPriorPenalty')
                .addSelect('SUM(billing.prinCurr)', 'totalDue')
                .addSelect('SUM(billing.intCurr)', 'totalInterest')
                .addSelect('SUM(billing.penCurr)', 'totalPenalty')
                .groupBy('billing.accountId')
                .getRawMany();

            const paymentSums = await paymentRepo
                .createQueryBuilder('payment')
                .select('payment.accountId', 'accountId')
                .addSelect('SUM(payment.amountPaid)', 'totalPaid')
                .groupBy('payment.accountId')
                .getRawMany();

            const dueMap = new Map<string, number>();
            const interestMap = new Map<string, number>();
            const penaltyMap = new Map<string, number>();
            const priorDueMap = new Map<string, number>();
            const priorInterestMap = new Map<string, number>();
            const priorPenaltyMap = new Map<string, number>();
            for (const row of billingSums) {
                const accountId = String(row.accountId || '').trim();
                if (!accountId) {
                    continue;
                }
                priorDueMap.set(accountId, Number(row.totalPriorDue ?? 0));
                priorInterestMap.set(accountId, Number(row.totalPriorInterest ?? 0));
                priorPenaltyMap.set(accountId, Number(row.totalPriorPenalty ?? 0));
                dueMap.set(accountId, Number(row.totalDue ?? 0));
                interestMap.set(accountId, Number(row.totalInterest ?? 0));
                penaltyMap.set(accountId, Number(row.totalPenalty ?? 0));
            }

            const paidMap = new Map<string, number>();
            for (const row of paymentSums) {
                const accountId = String(row.accountId || '').trim();
                if (!accountId) {
                    continue;
                }
                paidMap.set(accountId, Number(row.totalPaid ?? 0));
            }

            const accounts = await propertyRepo.find();
            for (const account of accounts) {
                const accountId = String(account.accountId || '').trim();
                if (!accountId) {
                    continue;
                }

                const totalDue = dueMap.get(accountId) ?? 0;
                const totalInterest = interestMap.get(accountId) ?? 0;
                const totalPenalty = penaltyMap.get(accountId) ?? 0;
                const totalPriorDue = priorDueMap.get(accountId) ?? 0;
                const totalPriorInterest = priorInterestMap.get(accountId) ?? 0;
                const totalPriorPenalty = priorPenaltyMap.get(accountId) ?? 0;
                const totalPaid = paidMap.get(accountId) ?? 0;
                account.balance =
                    totalPriorDue +
                    totalPriorInterest +
                    totalPriorPenalty +
                    totalDue +
                    totalInterest +
                    totalPenalty -
                    totalPaid;
            }

            if (accounts.length > 0) {
                await propertyRepo.save(accounts);
            }

            return { updated: accounts.length };
        });
    }

    private async parseMasterlistFile(file: Express.Multer.File): Promise<MasterlistRecord[]> {
        const fileName = file.originalname.toLowerCase();

        if (fileName.endsWith('.csv')) {
            return this.parseMasterlistCsv(file.buffer);
        }

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            return this.parseMasterlistXlsx(file.buffer);
        }

        throw new BadRequestException('Unsupported file type. Use CSV or XLSX.');
    }

    private async parseMasterlistCsv(buffer: Buffer): Promise<MasterlistRecord[]> {
        const rows: MasterlistRecord[] = [];
        const separator = this.detectDelimiter(buffer);

        await new Promise<void>((resolve, reject) => {
            Readable.from(buffer)
                .pipe(
                    csvParser({
                        separator,
                        mapHeaders: ({ header }) => header.replace(/^\uFEFF/, ''),
                    }),
                )
                .on('data', (row) => {
                    rows.push(this.normalizeMasterlistRecord(row));
                })
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        return rows;
    }

    private parseMasterlistXlsx(buffer: Buffer): MasterlistRecord[] {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        return rows.map((row) => this.normalizeMasterlistRecord(row as Record<string, unknown>));
    }

    private detectDelimiter(buffer: Buffer): string {
        const firstLine = buffer.toString('utf8').split(/\r?\n/)[0] || '';
        return firstLine.includes('\t') ? '\t' : ',';
    }

    private normalizeMasterlistRecord(raw: Record<string, unknown>): MasterlistRecord {
        const normalized: Record<string, unknown> = {};

        Object.entries(raw).forEach(([key, value]) => {
            const normalizedKey = key
                .toString()
                .trim()
                .toLowerCase()
                .replace(/[\s_-]/g, '');

            normalized[normalizedKey] = value;
        });

        return {
            accountId: String(normalized.accountid || '').trim(),
            neighborhood: String(normalized.neighborhood || '').trim(),
            block: String(normalized.block || '').trim(),
            lot: String(normalized.lot || '').trim(),
            memberName: String(normalized.membername || '').trim(),
            propertySizeSqm:
                normalized.propertysizesqm !== undefined && normalized.propertysizesqm !== ''
                    ? Number(normalized.propertysizesqm)
                    : null,
            classification: String(normalized.classification || '').trim(),
            soa:
                normalized.soa !== undefined && normalized.soa !== ''
                    ? Number(normalized.soa)
                    : null,
        };
    }

    private normalizeClassification(value: string): string | null {
        const normalized = value.trim().toUpperCase();
        if (normalized === 'HOMEOWNER') {
            return 'HOMEOWNER';
        }

        if (normalized === 'LOT OWNER' || normalized === 'LOTOWNER') {
            return 'LOT OWNER';
        }

        return null;
    }
}

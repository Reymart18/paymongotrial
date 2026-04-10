import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull } from 'typeorm';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import * as XLSX from 'xlsx';
import { FoxproBilling } from './foxpro-billing.entity';
import { FoxproPayment } from './foxpro-payment.entity';
import { PropertyAccount } from '../property/property.entity';
import { PropertyService } from '../property/property.service';

interface FoxproBillingRecord {
    accountId: string;
    billDate?: Date | null;
    dateFrom?: Date | null;
    dateTo?: Date | null;
    dueDate?: Date | null;
    prinBal: number;
    intBal: number;
    penBal: number;
    prinCurr: number;
    intCurr: number;
    penCurr: number;
}

interface FoxproPaymentRecord {
    accountId: string;
    paymentDate?: Date | null;
    amountPaid: number;
    description?: string;
    referenceNumber?: string | null;
}

@Injectable()
export class FoxproService {
    constructor(
        @InjectRepository(FoxproBilling)
        private billingRepo: Repository<FoxproBilling>,
        @InjectRepository(FoxproPayment)
        private paymentRepo: Repository<FoxproPayment>,
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
        private dataSource: DataSource,
        private propertyService: PropertyService,
    ) { }

    async uploadBillings(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const records = await this.parseBillingFile(file);
        const result = { inserted: 0, updated: 0, skipped: 0, errors: [] as string[] };

        await this.dataSource.transaction(async (manager) => {
            const billingRepo = manager.getRepository(FoxproBilling);
            const propertyRepo = manager.getRepository(PropertyAccount);

            for (let index = 0; index < records.length; index += 1) {
                const record = records[index];
                const row = index + 1;

                if (!record.accountId || !record.dueDate) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Missing accountId or dueDate`);
                    continue;
                }

                const account = await propertyRepo.findOne({
                    where: { accountId: record.accountId },
                });

                if (!account) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: accountId not found (${record.accountId})`);
                    continue;
                }

                const payload = {
                    accountId: record.accountId,
                    billDate: record.billDate ?? undefined,
                    dateFrom: record.dateFrom ?? undefined,
                    dateTo: record.dateTo ?? undefined,
                    dueDate: record.dueDate,
                    prinBal: record.prinBal,
                    intBal: record.intBal,
                    penBal: record.penBal,
                    prinCurr: record.prinCurr,
                    intCurr: record.intCurr,
                    penCurr: record.penCurr,
                };

                const existing = await billingRepo.findOne({
                    where: { accountId: record.accountId, dueDate: record.dueDate },
                });

                if (existing?.id) {
                    await billingRepo.update({ id: existing.id }, payload);
                    result.updated += 1;
                } else {
                    await billingRepo.insert(payload);
                    result.inserted += 1;
                }
            }
        });

        if (result.inserted + result.updated > 0) {
            await this.propertyService.recalculateBalances();
        }

        return result;
    }

    async uploadPayments(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const records = await this.parsePaymentFile(file);
        const result = { inserted: 0, updated: 0, skipped: 0, errors: [] as string[] };

        await this.dataSource.transaction(async (manager) => {
            const paymentRepo = manager.getRepository(FoxproPayment);
            const propertyRepo = manager.getRepository(PropertyAccount);

            for (let index = 0; index < records.length; index += 1) {
                const record = records[index];
                const row = index + 1;

                if (!record.accountId || !record.paymentDate) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Missing accountId or paymentDate`);
                    continue;
                }

                const account = await propertyRepo.findOne({
                    where: { accountId: record.accountId },
                });

                if (!account) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: accountId not found (${record.accountId})`);
                    continue;
                }

                const payload = paymentRepo.create({
                    accountId: record.accountId,
                    account,
                    paymentDate: record.paymentDate,
                    amountPaid: record.amountPaid,
                    description: record.description || '',
                    referenceNumber: record.referenceNumber ?? null,
                });

                const existing = await paymentRepo.findOne({
                    where: {
                        accountId: record.accountId,
                        paymentDate: record.paymentDate,
                        amountPaid: record.amountPaid,
                        referenceNumber:
                            record.referenceNumber === null
                                ? IsNull()
                                : record.referenceNumber,
                    },
                });

                if (existing?.id) {
                    await paymentRepo.update({ id: existing.id }, payload);
                    result.updated += 1;
                } else {
                    await paymentRepo.insert(payload);
                    result.inserted += 1;
                }
            }
        });

        if (result.inserted + result.updated > 0) {
            await this.propertyService.recalculateBalances();
        }

        return result;
    }

    private async parseBillingFile(file: Express.Multer.File): Promise<FoxproBillingRecord[]> {
        const fileName = file.originalname.toLowerCase();

        if (fileName.endsWith('.csv')) {
            return this.parseBillingCsv(file.buffer);
        }

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            return this.parseBillingXlsx(file.buffer);
        }

        throw new BadRequestException('Unsupported file type. Use CSV or XLSX.');
    }

    private async parsePaymentFile(file: Express.Multer.File): Promise<FoxproPaymentRecord[]> {
        const fileName = file.originalname.toLowerCase();

        if (fileName.endsWith('.csv')) {
            return this.parsePaymentCsv(file.buffer);
        }

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            return this.parsePaymentXlsx(file.buffer);
        }

        throw new BadRequestException('Unsupported file type. Use CSV or XLSX.');
    }

    private async parseBillingCsv(buffer: Buffer): Promise<FoxproBillingRecord[]> {
        const rows: FoxproBillingRecord[] = [];
        const separator = this.detectDelimiter(buffer);

        await new Promise<void>((resolve, reject) => {
            Readable.from(buffer)
                .pipe(csvParser({ separator }))
                .on('data', (row) => {
                    rows.push(this.normalizeBillingRecord(row));
                })
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        return rows;
    }

    private parseBillingXlsx(buffer: Buffer): FoxproBillingRecord[] {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        return rows.map((row) => this.normalizeBillingRecord(row as Record<string, unknown>));
    }

    private async parsePaymentCsv(buffer: Buffer): Promise<FoxproPaymentRecord[]> {
        const rows: FoxproPaymentRecord[] = [];
        const separator = this.detectDelimiter(buffer);

        await new Promise<void>((resolve, reject) => {
            Readable.from(buffer)
                .pipe(csvParser({ separator }))
                .on('data', (row) => {
                    rows.push(this.normalizePaymentRecord(row));
                })
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        return rows;
    }

    private parsePaymentXlsx(buffer: Buffer): FoxproPaymentRecord[] {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        return rows.map((row) => this.normalizePaymentRecord(row as Record<string, unknown>));
    }

    private normalizeBillingRecord(raw: Record<string, unknown>): FoxproBillingRecord {
        const normalized = this.normalizeKeys(raw);

        return {
            accountId: String(normalized.keysearch || '').trim(),
            billDate: this.parseFoxProDate(normalized.billdate),
            dateFrom: this.parseFoxProDate(normalized.datefrom),
            dateTo: this.parseFoxProDate(normalized.dateto),
            dueDate: this.parseFoxProDate(normalized.duedate),
            prinBal: this.toNumber(normalized.prinbal),
            intBal: this.toNumber(normalized.intbal),
            penBal: this.toNumber(normalized.penbal),
            prinCurr: this.toNumber(normalized.princurr),
            intCurr: this.toNumber(normalized.intcurr),
            penCurr: this.toNumber(normalized.pencurr),
        };
    }

    private normalizePaymentRecord(raw: Record<string, unknown>): FoxproPaymentRecord {
        const normalized = this.normalizeKeys(raw);

        return {
            accountId: String(normalized.keysearch || '').trim(),
            paymentDate: this.parseFoxProDate(normalized.paydate),
            amountPaid: this.toNumber(normalized.amtpaid),
            description: normalized.applicable ? String(normalized.applicable).trim() : '',
            referenceNumber: normalized.orno ? String(normalized.orno).trim() : '',
        };
    }

    private normalizeKeys(raw: Record<string, unknown>): Record<string, unknown> {
        const normalized: Record<string, unknown> = {};

        Object.entries(raw).forEach(([key, value]) => {
            const normalizedKey = key
                .toString()
                .trim()
                .split(',')[0]
                .trim()
                .toLowerCase()
                .replace(/[\s_-]/g, '');

            normalized[normalizedKey] = value;
        });

        return normalized;
    }

    private detectDelimiter(buffer: Buffer): string {
        const firstLine = buffer.toString('utf8').split(/\r?\n/)[0] || '';
        return firstLine.includes('\t') ? '\t' : ',';
    }

    private parseFoxProDate(value: unknown): Date | null {
        if (!value) {
            return null;
        }

        if (value instanceof Date) {
            return value;
        }

        const text = String(value).trim();
        if (!text) {
            return null;
        }

        const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
        if (slashMatch) {
            const month = Number(slashMatch[1]);
            const day = Number(slashMatch[2]);
            const yearTwo = Number(slashMatch[3]);
            const year = yearTwo <= 79 ? 2000 + yearTwo : 1900 + yearTwo;
            return new Date(year, month - 1, day);
        }

        const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) {
            const year = Number(isoMatch[1]);
            const month = Number(isoMatch[2]);
            const day = Number(isoMatch[3]);
            return new Date(year, month - 1, day);
        }

        const parsed = new Date(text);
        if (Number.isNaN(parsed.getTime())) {
            return null;
        }

        return parsed;
    }

    private toNumber(value: unknown): number {
        if (value === null || value === undefined || value === '') {
            return 0;
        }

        const num = Number(value);
        return Number.isNaN(num) ? 0 : num;
    }
}

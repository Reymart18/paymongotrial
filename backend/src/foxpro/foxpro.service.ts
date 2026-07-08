import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull, In } from 'typeorm';
import { Readable } from 'stream';
import { DBFFile } from 'dbffile';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomBytes } from 'crypto';
import csvParser from 'csv-parser';
import * as XLSX from 'xlsx';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { FoxproBilling } from './foxpro-billing.entity';
import { FoxproPayment } from './foxpro-payment.entity';
import { PropertyAccount } from '../property/property.entity';
import { PropertyService } from '../property/property.service';
import { QuarterlyReportSnapshot } from '../reports/quarterly-report.entity';
import { assertLocalDbfMode } from '../sync/sync-mode.util';

export interface FoxproBillingRecord {
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
    duesRate: number;
}

export interface FoxproPaymentRecord {
    accountId?: string | null;
    paymentDate?: Date | null;
    amountPaid: number;
    description?: string;
    paycat?: string | null;
    referenceNumber?: string | null;
}

export interface FoxproMemberRecord {
    accountId: string;
    neighborhood: string;
    block: string;
    lot: string;
    memberName: string;
    propertySizeSqm?: number | null;
    classification?: string | null;
    gmail?: string | null;
    telno?: string | null;
    celno?: string | null;
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
        @InjectRepository(QuarterlyReportSnapshot)
        private snapshotRepo: Repository<QuarterlyReportSnapshot>,
        private dataSource: DataSource,
        private propertyService: PropertyService,
    ) { }

    async uploadBillings(file: Express.Multer.File) {
        assertLocalDbfMode();
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const records = await this.parseBillingFile(file);
        const result = { inserted: 0, updated: 0, skipped: 0, errors: [] as string[] };

        await this.dataSource.transaction(async (manager) => {
            const billingRepo = manager.getRepository(FoxproBilling);
            const propertyRepo = manager.getRepository(PropertyAccount);
            const snapshotRepo = manager.getRepository(QuarterlyReportSnapshot);

            await this.snapshotQuarterlyBillings(billingRepo, snapshotRepo);

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
                    duesRate: record.duesRate,
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

            await this.snapshotQuarterlyBillings(billingRepo, snapshotRepo);
        });

        if (result.inserted + result.updated > 0) {
            await this.propertyService.recalculateBalances();
        }

        return result;
    }

    async uploadPayments(file: Express.Multer.File) {
        assertLocalDbfMode();
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const records = await this.parsePaymentFile(file);
        return this.savePaymentRecords(records);
    }

    async syncBillingsFromDbf(filePath?: string) {
        assertLocalDbfMode();
        const dbfPath = filePath ?? this.getBillingsDbfPath();
        if (!fs.existsSync(dbfPath)) {
            throw new BadRequestException(`billing.dbf not found at ${dbfPath}`);
        }

        const records = await this.parseBillingDbf(dbfPath);
        return this.saveBillingRecords(records);
    }

    async syncPaymentsFromDbf(filePath?: string) {
        assertLocalDbfMode();
        const dbfPath = filePath ?? this.getPaymentsDbfPath();
        if (!fs.existsSync(dbfPath)) {
            throw new BadRequestException(`payments.dbf not found at ${dbfPath}`);
        }

        const records = await this.parsePaymentDbf(dbfPath);
        return this.savePaymentRecords(records);
    }

    async syncMembersFromDbf(filePath?: string) {
        assertLocalDbfMode();
        const dbfPath = filePath ?? this.getMembersDbfPath();
        if (!fs.existsSync(dbfPath)) {
            throw new BadRequestException(`members.dbf not found at ${dbfPath}`);
        }

        const records = await this.parseMembersDbf(dbfPath);
        return this.saveMemberRecords(records);
    }

    async syncBillingsFromJson(records: Array<Record<string, unknown>>) {
        return this.saveBillingRecords(
            records.map((record) => this.normalizePushedBillingRecord(record)),
            false,
        );
    }

    async syncPaymentsFromJson(records: Array<Record<string, unknown>>) {
        return this.savePaymentRecords(
            records.map((record) => this.normalizePushedPaymentRecord(record)),
            false,
        );
    }

    async syncMembersFromJson(records: Array<Record<string, unknown>>) {
        return this.saveMemberRecords(records.map((record) => this.normalizePushedMemberRecord(record)));
    }

    private async saveMemberRecords(records: FoxproMemberRecord[]) {
        const result = {
            inserted: 0,
            updated: 0,
            skipped: 0,
            emailed: 0,
            emailFailed: 0,
            errors: [] as string[],
        };
        const createdCredentials: Array<{
            accountId: string;
            memberName: string;
            gmail: string;
            temporaryPassword: string;
        }> = [];

        await this.dataSource.transaction(async (manager) => {
            const propertyRepo = manager.getRepository(PropertyAccount);

            for (let index = 0; index < records.length; index += 1) {
                const record = records[index];
                const row = index + 1;

                if (!record.accountId || !record.memberName) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Missing accountId or memberName`);
                    continue;
                }

                const normalizedClass = record.classification
                    ? this.normalizeMemberClassification(record.classification)
                    : null;

                if (!normalizedClass) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Invalid classification (${record.classification ?? ''})`);
                    continue;
                }

                const existing = await propertyRepo.findOne({ where: { accountId: record.accountId } });
                if (existing) {
                    let changed = false;

                    if (record.neighborhood && existing.neighborhood !== record.neighborhood) {
                        existing.neighborhood = record.neighborhood;
                        changed = true;
                    }

                    if (record.block && existing.block !== record.block) {
                        existing.block = record.block;
                        changed = true;
                    }

                    if (record.lot && existing.lot !== record.lot) {
                        existing.lot = record.lot;
                        changed = true;
                    }

                    if (record.memberName && existing.memberName !== record.memberName) {
                        existing.memberName = record.memberName;
                        changed = true;
                    }

                    if (record.gmail && existing.gmail !== record.gmail) {
                        existing.gmail = record.gmail;
                        changed = true;
                    }

                    if (record.telno && existing.telno !== record.telno) {
                        existing.telno = record.telno;
                        changed = true;
                    }

                    if (record.celno && existing.celno !== record.celno) {
                        existing.celno = record.celno;
                        changed = true;
                    }

                    if (record.propertySizeSqm !== null && record.propertySizeSqm !== undefined) {
                        const existingSize = existing.propertySizeSqm ?? null;
                        if (existingSize === null || Number(existingSize) !== Number(record.propertySizeSqm)) {
                            existing.propertySizeSqm = record.propertySizeSqm;
                            changed = true;
                        }
                    }

                    if (existing.classification !== normalizedClass) {
                        existing.classification = normalizedClass;
                        changed = true;
                    }

                    if (changed) {
                        await propertyRepo.save(existing);
                        result.updated += 1;
                    } else {
                        result.skipped += 1;
                    }
                    continue;
                }

                if (!record.gmail) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Gmail is required to create a new account (${record.accountId})`);
                    continue;
                }

                const temporaryPassword = this.generateTemporaryPassword();
                const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
                const account = propertyRepo.create({
                    accountId: record.accountId,
                    neighborhood: record.neighborhood,
                    block: record.block,
                    lot: record.lot,
                    memberName: record.memberName,
                    gmail: record.gmail || undefined,
                    telno: record.telno || undefined,
                    celno: record.celno || undefined,
                    propertySizeSqm:
                        record.propertySizeSqm !== undefined && record.propertySizeSqm !== null
                            ? Number(record.propertySizeSqm)
                            : undefined,
                    classification: normalizedClass,
                    username: record.accountId,
                    password: hashedPassword,
                    passwordChanged: false,
                    balance: 0,
                });

                await propertyRepo.save(account);
                createdCredentials.push({
                    accountId: record.accountId,
                    memberName: record.memberName,
                    gmail: record.gmail,
                    temporaryPassword,
                });
                result.inserted += 1;
            }
        });

        for (const credentials of createdCredentials) {
            try {
                await this.sendMemberCredentialsEmail(credentials);
                result.emailed += 1;
            } catch (err) {
                result.emailFailed += 1;
                result.errors.push(
                    `Account ${credentials.accountId}: Failed to email credentials to ${credentials.gmail}`,
                );
                console.error('Member credentials email error:', err);
            }
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

        if (fileName.endsWith('.dbf')) {
            return this.parseDbfUpload(file.buffer, (dbfPath) => this.parseBillingDbf(dbfPath));
        }

        throw new BadRequestException('Unsupported file type. Use CSV, XLSX, or DBF.');
    }

    private async parsePaymentFile(file: Express.Multer.File): Promise<FoxproPaymentRecord[]> {
        const fileName = file.originalname.toLowerCase();

        if (fileName.endsWith('.csv')) {
            return this.parsePaymentCsv(file.buffer);
        }

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            return this.parsePaymentXlsx(file.buffer);
        }

        if (fileName.endsWith('.dbf')) {
            return this.parseDbfUpload(file.buffer, (dbfPath) => this.parsePaymentDbf(dbfPath));
        }

        throw new BadRequestException('Unsupported file type. Use CSV, XLSX, or DBF.');
    }

    private async parseDbfUpload<T>(
        buffer: Buffer,
        parseFile: (dbfPath: string) => Promise<T>,
    ): Promise<T> {
        const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'foxpro-'));
        const tempPath = path.join(tempDir, 'upload.dbf');

        try {
            await fs.promises.writeFile(tempPath, buffer);
            return await parseFile(tempPath);
        } finally {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        }
    }

    private async parsePaymentDbf(filePath: string): Promise<FoxproPaymentRecord[]> {
        const dbf = await DBFFile.open(filePath, { encoding: 'latin1' });
        const rows: FoxproPaymentRecord[] = [];
        let records = await dbf.readRecords(500);

        while (records.length > 0) {
            records.forEach((row) => {
                rows.push(this.normalizePaymentRecord(row as Record<string, unknown>));
            });
            records = await dbf.readRecords(500);
        }

        return rows;
    }

    private async parseBillingDbf(filePath: string): Promise<FoxproBillingRecord[]> {
        const dbf = await DBFFile.open(filePath, { encoding: 'latin1' });
        const rows: FoxproBillingRecord[] = [];
        let records = await dbf.readRecords(500);

        while (records.length > 0) {
            records.forEach((row) => {
                rows.push(this.normalizeBillingRecord(row as Record<string, unknown>));
            });
            records = await dbf.readRecords(500);
        }

        return rows;
    }

    private async parseMembersDbf(filePath: string): Promise<FoxproMemberRecord[]> {
        const dbf = await DBFFile.open(filePath, { encoding: 'latin1' });
        const rows: FoxproMemberRecord[] = [];
        let records = await dbf.readRecords(500);

        while (records.length > 0) {
            records.forEach((row) => {
                rows.push(this.normalizeMemberRecord(row as Record<string, unknown>));
            });
            records = await dbf.readRecords(500);
        }

        return rows;
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
            duesRate: this.toNumber(normalized.duesrate),
        };
    }

    private normalizePaymentRecord(raw: Record<string, unknown>): FoxproPaymentRecord {
        const normalized = this.normalizeKeys(raw);
        const referenceNumber = normalized.orno ? String(normalized.orno).trim() : '';
        const paycat = normalized.paycat ? String(normalized.paycat).trim() : '';
        const normalizedPaycat = paycat.toLowerCase();
        const descriptionSource = normalizedPaycat === 'membership dues'
            ? normalized.applicable
            : normalized.particula3;

        const accountId = String(normalized.keysearch || '').trim();

        return {
            accountId: accountId ? accountId : null,
            paymentDate: this.parseFoxProDate(normalized.paydate),
            amountPaid: this.toNumber(normalized.amtpaid),
            description: descriptionSource ? String(descriptionSource).trim() : '',
            paycat: paycat ? paycat : null,
            referenceNumber: referenceNumber ? referenceNumber : null,
        };
    }

    private normalizeMemberRecord(raw: Record<string, unknown>): FoxproMemberRecord {
        const normalized = this.normalizeKeys(raw);
        const neighborhood = this.cleanText(normalized.neighbor || normalized.neighborhood);
        const block = this.formatMemberSegment(normalized.block1 || normalized.block, 3);
        const lot = this.formatMemberSegment(normalized.lot || normalized.lotno, 3);
        const accountId = this.resolveMemberAccountId(normalized, neighborhood, block, lot);
        const fallbackSegments = this.parseMemberSegmentsFromAccountId(accountId);
        const resolvedNeighborhood = neighborhood || fallbackSegments.neighborhood;
        const resolvedBlock = block || fallbackSegments.block;
        const resolvedLot = lot || fallbackSegments.lot;
        const memberName = this.buildMemberName(normalized);
        const propertySizeSqm = this.toNumberOrNull(normalized.lotsize);
        const classificationRaw = normalized.holo || normalized.classification || '';
        const gmail = this.cleanText(
            normalized.gmail
            || normalized.email
            || normalized.emailadd
            || normalized.emailaddress
            || normalized.mail
            || normalized.mailadd
            || normalized.mailaddress,
        );
        const telno = this.cleanText(normalized.telno);
        const celno = this.cleanText(normalized.celno);

        return {
            accountId,
            neighborhood: resolvedNeighborhood,
            block: resolvedBlock,
            lot: resolvedLot,
            memberName,
            propertySizeSqm,
            classification: classificationRaw ? String(classificationRaw).trim() : null,
            gmail: gmail || null,
            telno: telno || null,
            celno: celno || null,
        };
    }

    private normalizePushedBillingRecord(raw: Record<string, unknown>): FoxproBillingRecord {
        const normalized = this.normalizeKeys(raw);

        return {
            accountId: this.cleanText(normalized.accountid || normalized.keysearch),
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
            duesRate: this.toNumber(normalized.duesrate),
        };
    }

    private normalizePushedPaymentRecord(raw: Record<string, unknown>): FoxproPaymentRecord {
        const normalized = this.normalizeKeys(raw);
        const paycat = this.cleanText(normalized.paycat);
        const descriptionSource = normalized.description
            || (paycat.toLowerCase() === 'membership dues'
                ? normalized.applicable
                : normalized.particula3);
        const accountId = this.cleanText(normalized.accountid || normalized.keysearch);
        const referenceNumber = this.cleanText(normalized.referencenumber || normalized.orno);

        return {
            accountId: accountId || null,
            paymentDate: this.parseFoxProDate(normalized.paymentdate || normalized.paydate),
            amountPaid: this.toNumber(normalized.amountpaid || normalized.amtpaid),
            description: descriptionSource ? String(descriptionSource).trim() : '',
            paycat: paycat || null,
            referenceNumber: referenceNumber || null,
        };
    }

    private normalizePushedMemberRecord(raw: Record<string, unknown>): FoxproMemberRecord {
        const normalized = this.normalizeKeys(raw);
        const hasNormalizedShape = normalized.accountid || normalized.membername;
        if (!hasNormalizedShape) {
            return this.normalizeMemberRecord(raw);
        }

        const accountId = this.cleanText(normalized.accountid || normalized.keysearch);
        const fallbackSegments = this.parseMemberSegmentsFromAccountId(accountId);
        const neighborhood = this.cleanText(normalized.neighborhood || normalized.neighbor) || fallbackSegments.neighborhood;
        const block = this.formatMemberSegment(normalized.block || normalized.block1, 3) || fallbackSegments.block;
        const lot = this.formatMemberSegment(normalized.lot || normalized.lotno, 3) || fallbackSegments.lot;
        const gmail = this.cleanText(
            normalized.gmail
            || normalized.email
            || normalized.emailadd
            || normalized.emailaddress,
        );

        return {
            accountId,
            neighborhood,
            block,
            lot,
            memberName: this.cleanText(normalized.membername || normalized.name),
            propertySizeSqm: this.toNumberOrNull(normalized.propertysizesqm || normalized.lotsize),
            classification: normalized.classification || normalized.holo
                ? String(normalized.classification || normalized.holo).trim()
                : null,
            gmail: gmail || null,
            telno: this.cleanText(normalized.telno) || null,
            celno: this.cleanText(normalized.celno) || null,
        };
    }

    private async savePaymentRecords(records: FoxproPaymentRecord[], applyLocalFilters = true) {
        const result = { inserted: 0, updated: 0, skipped: 0, errors: [] as string[] };
        const paymentCutoff = applyLocalFilters ? this.getPaymentsCutoffDate() : null;
        const batchSize = 500;

        await this.dataSource.transaction(async (manager) => {
            const paymentRepo = manager.getRepository(FoxproPayment);
            const propertyRepo = manager.getRepository(PropertyAccount);
            const prepared: Array<{ record: FoxproPaymentRecord; row: number }> = [];
            const accountIds = new Set<string>();

            for (let index = 0; index < records.length; index += 1) {
                const record = records[index];
                const row = index + 1;

                if (!record.paymentDate) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Missing paymentDate`);
                    continue;
                }

                if (paymentCutoff && record.paymentDate < paymentCutoff) {
                    result.skipped += 1;
                    continue;
                }

                prepared.push({ record, row });
                if (record.accountId) {
                    accountIds.add(record.accountId);
                }
            }

            const accountIdList = Array.from(accountIds);
            const accounts = accountIdList.length
                ? await propertyRepo.find({ where: { accountId: In(accountIdList) } })
                : [];
            const accountMap = new Map(accounts.map((account) => [account.accountId ?? '', account]));

            const withRef: Array<{ record: FoxproPaymentRecord; row: number }> = [];
            const withoutRef: Array<{ record: FoxproPaymentRecord; row: number }> = [];

            for (const entry of prepared) {
                if (entry.record.accountId && !accountMap.has(entry.record.accountId)) {
                    result.skipped += 1;
                    result.errors.push(`Row ${entry.row}: accountId not found (${entry.record.accountId})`);
                    continue;
                }

                if (entry.record.referenceNumber) {
                    withRef.push(entry);
                } else {
                    withoutRef.push(entry);
                }
            }

            for (let start = 0; start < withRef.length; start += batchSize) {
                const batch = withRef.slice(start, start + batchSize);
                const referenceNumbers = batch
                    .map((entry) => entry.record.referenceNumber)
                    .filter((value): value is string => Boolean(value));

                const existingRows = referenceNumbers.length
                    ? await paymentRepo.find({ where: { referenceNumber: In(referenceNumbers) } })
                    : [];
                const existingByRef = new Map(
                    existingRows.map((row) => [row.referenceNumber ?? '', row]),
                );
                const inserts: Array<Partial<FoxproPayment>> = [];

                for (const entry of batch) {
                    const record = entry.record;
                    if (!record.paymentDate) {
                        result.skipped += 1;
                        continue;
                    }
                    const payload = {
                        accountId: record.accountId ?? null,
                        paymentDate: record.paymentDate,
                        amountPaid: record.amountPaid,
                        description: record.description || '',
                        paycat: record.paycat ?? null,
                        referenceNumber: record.referenceNumber ?? null,
                    };
                    const existing = existingByRef.get(record.referenceNumber ?? '') ?? null;

                    if (!existing) {
                        inserts.push(payload);
                        result.inserted += 1;
                        continue;
                    }

                    if (this.isPaymentChanged(existing, payload)) {
                        await paymentRepo.update({ id: existing.id }, payload);
                        result.updated += 1;
                    } else {
                        result.skipped += 1;
                    }
                }

                if (inserts.length) {
                    await paymentRepo.insert(inserts);
                }
            }

            for (const entry of withoutRef) {
                const record = entry.record;
                if (!record.paymentDate) {
                    result.skipped += 1;
                    continue;
                }
                const payload = {
                    accountId: record.accountId ?? null,
                    paymentDate: record.paymentDate,
                    amountPaid: record.amountPaid,
                    description: record.description || '',
                    paycat: record.paycat ?? null,
                    referenceNumber: null,
                };

                const existing = await paymentRepo.findOne({
                    where: {
                        accountId: record.accountId ? record.accountId : IsNull(),
                        paymentDate: record.paymentDate,
                        amountPaid: record.amountPaid,
                        referenceNumber: IsNull(),
                    },
                });

                if (existing?.id) {
                    if (this.isPaymentChanged(existing, payload)) {
                        await paymentRepo.update({ id: existing.id }, payload);
                        result.updated += 1;
                    } else {
                        result.skipped += 1;
                    }
                    continue;
                }

                await paymentRepo.insert(payload);
                result.inserted += 1;
            }
        });

        if (result.inserted + result.updated > 0) {
            await this.propertyService.recalculateBalances();
        }

        return result;
    }

    private async saveBillingRecords(records: FoxproBillingRecord[], applyLocalFilters = true) {
        const result = { inserted: 0, updated: 0, skipped: 0, errors: [] as string[] };
        const startDate = applyLocalFilters ? this.getBillingsStartDate() : null;

        await this.dataSource.transaction(async (manager) => {
            const billingRepo = manager.getRepository(FoxproBilling);
            const propertyRepo = manager.getRepository(PropertyAccount);
            const snapshotRepo = manager.getRepository(QuarterlyReportSnapshot);

            await this.snapshotQuarterlyBillings(billingRepo, snapshotRepo);

            const prepared: Array<{ record: FoxproBillingRecord; row: number }> = [];
            const accountIds = new Set<string>();

            for (let index = 0; index < records.length; index += 1) {
                const record = records[index];
                const row = index + 1;

                if (!record.accountId || !record.dueDate || !record.dateTo) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Missing accountId, dueDate, or dateTo`);
                    continue;
                }

                if (startDate && record.dateFrom && record.dateFrom < startDate) {
                    result.skipped += 1;
                    continue;
                }

                prepared.push({ record, row });
                accountIds.add(record.accountId);
            }

            const accountIdList = Array.from(accountIds);
            const accounts = accountIdList.length
                ? await propertyRepo.find({ where: { accountId: In(accountIdList) } })
                : [];
            const accountMap = new Map(accounts.map((account) => [account.accountId ?? '', account]));

            const latestDateToRows = accountIdList.length
                ? await billingRepo
                    .createQueryBuilder('billing')
                    .select('billing.accountId', 'accountId')
                    .addSelect('MAX(billing.dateTo)', 'latestDateTo')
                    .where('billing.accountId IN (:...accountIds)', { accountIds: accountIdList })
                    .groupBy('billing.accountId')
                    .getRawMany<{ accountId: string; latestDateTo: Date | string | null }>()
                : [];
            const latestDateToMap = new Map(
                latestDateToRows.map((row) => [
                    row.accountId,
                    row.latestDateTo ? new Date(row.latestDateTo) : null,
                ]),
            );

            const existingDueDateRows = accountIdList.length
                ? await billingRepo
                    .createQueryBuilder('billing')
                    .select('billing.accountId', 'accountId')
                    .addSelect('billing.dueDate', 'dueDate')
                    .where('billing.accountId IN (:...accountIds)', { accountIds: accountIdList })
                    .getRawMany<{ accountId: string; dueDate: Date | string | null }>()
                : [];
            const existingKeys = new Set(
                existingDueDateRows
                    .map((row) => {
                        const dueDateKey = this.toDateKey(row.dueDate);
                        return dueDateKey ? `${row.accountId}-${dueDateKey}` : null;
                    })
                    .filter((value): value is string => Boolean(value)),
            );

            for (const entry of prepared) {
                const record = entry.record;
                const dueDate = record.dueDate ?? null;
                if (!accountMap.has(record.accountId)) {
                    result.skipped += 1;
                    result.errors.push(`Row ${entry.row}: accountId not found (${record.accountId})`);
                    continue;
                }

                if (!dueDate) {
                    result.skipped += 1;
                    result.errors.push(`Row ${entry.row}: Missing dueDate`);
                    continue;
                }

                const latestDateTo = latestDateToMap.get(record.accountId) ?? null;
                if (latestDateTo && record.dateTo && record.dateTo <= latestDateTo) {
                    result.skipped += 1;
                    continue;
                }

                const payload = {
                    accountId: record.accountId,
                    billDate: record.billDate ?? undefined,
                    dateFrom: record.dateFrom ?? undefined,
                    dateTo: record.dateTo ?? undefined,
                    dueDate,
                    prinBal: record.prinBal,
                    intBal: record.intBal,
                    penBal: record.penBal,
                    prinCurr: record.prinCurr,
                    intCurr: record.intCurr,
                    penCurr: record.penCurr,
                    duesRate: record.duesRate,
                };

                const key = `${record.accountId}-${this.toDateKey(dueDate)}`;
                const isExisting = existingKeys.has(key);
                await billingRepo
                    .createQueryBuilder()
                    .insert()
                    .into(FoxproBilling)
                    .values(payload)
                    .orUpdate(
                        [
                            'billDate',
                            'dateFrom',
                            'dateTo',
                            'prinBal',
                            'intBal',
                            'penBal',
                            'prinCurr',
                            'intCurr',
                            'penCurr',
                            'duesRate',
                        ],
                        ['accountId', 'dueDate'],
                    )
                    .updateEntity(false)
                    .execute();
                if (isExisting) {
                    result.updated += 1;
                } else {
                    result.inserted += 1;
                    existingKeys.add(key);
                }
            }

            await this.snapshotQuarterlyBillings(billingRepo, snapshotRepo);
        });

        if (result.inserted + result.updated > 0) {
            await this.propertyService.recalculateBalances();
        }

        return result;
    }

    private getMembersDbfPath(): string {
        if (process.env.FOXPRO_MEMBERS_DBF_PATH) {
            return process.env.FOXPRO_MEMBERS_DBF_PATH;
        }

        return path.resolve('C:/Users/CLienT/Documents/hoaportal/MEMBERS.DBF');
    }

    private getPaymentsDbfPath(): string {
        if (process.env.FOXPRO_PAYMENTS_DBF_PATH) {
            return process.env.FOXPRO_PAYMENTS_DBF_PATH;
        }

        return path.resolve('C:/parkplacevillagesystemPayments/payments.dbf');
    }

    private getBillingsDbfPath(): string {
        if (process.env.FOXPRO_BILLINGS_DBF_PATH) {
            return process.env.FOXPRO_BILLINGS_DBF_PATH;
        }

        return path.resolve('C:/Users/CLienT/Documents/hoaportal/BILLING.DBF');
    }

    private getBillingsStartDate(): Date | null {
        const configured = process.env.FOXPRO_BILLINGS_START_DATE;
        if (configured) {
            const parsed = new Date(`${configured}T00:00:00.000Z`);
            if (!Number.isNaN(parsed.getTime())) {
                return parsed;
            }
        }

        return null;
    }

    private getPaymentsCutoffDate(): Date {
        const configured = process.env.FOXPRO_PAYMENTS_CUTOFF_DATE;
        if (configured) {
            const parsed = new Date(`${configured}T00:00:00.000Z`);
            if (!Number.isNaN(parsed.getTime())) {
                return parsed;
            }
        }

        return new Date(Date.UTC(2025, 9, 1));
    }

    private generateTemporaryPassword(): string {
        return randomBytes(6).toString('hex');
    }

    private getMailer() {
        const host = process.env.SMTP_HOST || 'smtp.gmail.com';
        const port = Number(process.env.SMTP_PORT || 465);
        const secure = process.env.SMTP_SECURE
            ? process.env.SMTP_SECURE === 'true'
            : port === 465;
        const requireTls = process.env.SMTP_REQUIRE_TLS === 'true';
        const forceIpv4 = process.env.SMTP_FORCE_IPV4 === 'true';
        const user = process.env.SMTP_USER || '';
        const pass = process.env.SMTP_PASS || '';

        if (!user || !pass) {
            throw new BadRequestException('Email service is not configured.');
        }

        const transportOptions: SMTPTransport.Options & { family?: number } = {
            host,
            port,
            secure,
            auth: { user, pass },
        };

        if (requireTls) {
            transportOptions.requireTLS = true;
        }

        if (forceIpv4) {
            transportOptions.family = 4;
        }

        return nodemailer.createTransport(transportOptions);
    }

    private async sendMemberCredentialsEmail(credentials: {
        accountId: string;
        memberName: string;
        gmail: string;
        temporaryPassword: string;
    }) {
        const transporter = this.getMailer();
        const from = process.env.SMTP_FROM || process.env.SMTP_USER || '';

        await transporter.sendMail({
            from,
            to: credentials.gmail,
            subject: 'Your HOA Portal Account Credentials',
            text: [
                `Hello ${credentials.memberName || 'Member'},`,
                '',
                'Your HOA Portal account has been created.',
                '',
                'Portal link: https://parkplacevillage.com',
                `Username / Account ID: ${credentials.accountId}`,
                `Temporary password: ${credentials.temporaryPassword}`,
                '',
                'Please log in and change your password immediately.',
            ].join('\n'),
        });
    }

    private async snapshotQuarterlyBillings(
        billingRepo: Repository<FoxproBilling>,
        snapshotRepo: Repository<QuarterlyReportSnapshot>,
    ) {
        const rows = await billingRepo
            .createQueryBuilder('billing')
            .select('YEAR(COALESCE(billing.dateFrom, billing.dateTo))', 'year')
            .addSelect('QUARTER(COALESCE(billing.dateFrom, billing.dateTo))', 'quarter')
            .addSelect(
                'COALESCE(SUM(billing.prinCurr + billing.intCurr + billing.penCurr), 0)',
                'total',
            )
            .where('COALESCE(billing.dateFrom, billing.dateTo) IS NOT NULL')
            .groupBy('year')
            .addGroupBy('quarter')
            .getRawMany<{ year: number | string; quarter: number | string; total: number | string }>();

        const payload = rows
            .map((row) => ({
                year: Number(row.year),
                quarter: Number(row.quarter),
                billedTotal: Number(row.total || 0),
            }))
            .filter((row) => row.year && row.quarter && row.billedTotal > 0);

        if (!payload.length) {
            return;
        }

        await snapshotRepo
            .createQueryBuilder()
            .insert()
            .into(QuarterlyReportSnapshot)
            .values(payload)
            .orUpdate(['billedTotal'], ['year', 'quarter'])
            .updateEntity(false)
            .execute();
    }

    private isPaymentChanged(
        existing: FoxproPayment,
        payload: {
            accountId?: string | null;
            paymentDate: Date;
            amountPaid: number;
            description: string;
            paycat: string | null;
            referenceNumber: string | null;
        },
    ): boolean {
        const existingDateKey = this.toDateKey(existing.paymentDate);
        const payloadDateKey = this.toDateKey(payload.paymentDate);

        return (
            String(existing.accountId || '') !== String(payload.accountId || '') ||
            existingDateKey !== payloadDateKey ||
            Number(existing.amountPaid || 0) !== Number(payload.amountPaid || 0) ||
            (existing.description || '') !== (payload.description || '') ||
            (existing.paycat ?? null) !== payload.paycat ||
            (existing.referenceNumber ?? null) !== payload.referenceNumber
        );
    }

    private toDateKey(value: Date | string | null | undefined): string | null {
        if (!value) {
            return null;
        }

        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
            return null;
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
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

    private toNumberOrNull(value: unknown): number | null {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        const num = Number(value);
        return Number.isNaN(num) ? null : num;
    }

    private toNumber(value: unknown): number {
        if (value === null || value === undefined || value === '') {
            return 0;
        }

        const num = Number(value);
        return Number.isNaN(num) ? 0 : num;
    }

    private normalizeMemberClassification(value: string): string | null {
        const normalized = value.trim().toLowerCase();
        if (!normalized) {
            return null;
        }

        if (normalized === 'ho' || normalized === 'homeowner' || normalized === 'home owner') {
            return 'HOMEOWNER';
        }

        if (normalized === 'lo' || normalized === 'lot owner' || normalized === 'lotowner') {
            return 'LOT OWNER';
        }

        return null;
    }

    private cleanText(value: unknown): string {
        if (value === null || value === undefined) {
            return '';
        }

        return String(value).trim();
    }

    private formatMemberSegment(value: unknown, length: number): string {
        const text = this.cleanText(value);
        if (!text) {
            return '';
        }

        if (/^\d+$/.test(text)) {
            return text.padStart(length, '0');
        }

        return text;
    }

    private resolveMemberAccountId(
        normalized: Record<string, unknown>,
        neighborhood: string,
        block: string,
        lot: string,
    ): string {
        const keysearch = this.cleanText(normalized.keysearch);
        if (keysearch) {
            return keysearch;
        }

        if (neighborhood && block && lot) {
            return `${neighborhood}${block}${lot}`;
        }

        return '';
    }

    private buildMemberName(normalized: Record<string, unknown>): string {
        const lastName = this.cleanText(normalized.lastname || normalized.last || normalized.surname);
        const firstName = this.cleanText(normalized.firstname || normalized.first);
        const middleName = this.cleanText(normalized.midname || normalized.middle);

        const base = [lastName, firstName].filter(Boolean).join(', ');
        if (!base) {
            return this.cleanText(normalized.membername || normalized.name);
        }

        return middleName ? `${base} ${middleName}` : base;
    }

    private parseMemberSegmentsFromAccountId(accountId: string): {
        neighborhood: string;
        block: string;
        lot: string;
    } {
        const match = accountId.match(/^([A-Za-z]+)(\d{3})(\d{3})$/);
        if (!match) {
            return { neighborhood: '', block: '', lot: '' };
        }

        return {
            neighborhood: match[1],
            block: match[2],
            lot: match[3],
        };
    }
}

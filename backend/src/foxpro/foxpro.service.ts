import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, IsNull, In } from 'typeorm';
import { Readable } from 'stream';
import { DBFFile } from 'dbffile';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import csvParser from 'csv-parser';
import * as XLSX from 'xlsx';
import { FoxproBilling } from './foxpro-billing.entity';
import { FoxproPayment } from './foxpro-payment.entity';
import { PropertyAccount } from '../property/property.entity';
import { PropertyService } from '../property/property.service';
import { QuarterlyReportSnapshot } from '../reports/quarterly-report.entity';

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
    duesRate: number;
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
        @InjectRepository(QuarterlyReportSnapshot)
        private snapshotRepo: Repository<QuarterlyReportSnapshot>,
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
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const records = await this.parsePaymentFile(file);
        return this.savePaymentRecords(records);
    }

    async syncBillingsFromDbf(filePath?: string) {
        const dbfPath = filePath ?? this.getBillingsDbfPath();
        if (!fs.existsSync(dbfPath)) {
            throw new BadRequestException(`billing.dbf not found at ${dbfPath}`);
        }

        const records = await this.parseBillingDbf(dbfPath);
        return this.saveBillingRecords(records);
    }

    async syncPaymentsFromDbf(filePath?: string) {
        const dbfPath = filePath ?? this.getPaymentsDbfPath();
        if (!fs.existsSync(dbfPath)) {
            throw new BadRequestException(`payments.dbf not found at ${dbfPath}`);
        }

        const records = await this.parsePaymentDbf(dbfPath);
        return this.savePaymentRecords(records);
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

        return {
            accountId: String(normalized.keysearch || '').trim(),
            paymentDate: this.parseFoxProDate(normalized.paydate),
            amountPaid: this.toNumber(normalized.amtpaid),
            description: normalized.applicable ? String(normalized.applicable).trim() : '',
            referenceNumber: referenceNumber ? referenceNumber : null,
        };
    }

    private async savePaymentRecords(records: FoxproPaymentRecord[]) {
        const result = { inserted: 0, updated: 0, skipped: 0, errors: [] as string[] };
        const paymentCutoff = this.getPaymentsCutoffDate();
        const batchSize = 500;

        await this.dataSource.transaction(async (manager) => {
            const paymentRepo = manager.getRepository(FoxproPayment);
            const propertyRepo = manager.getRepository(PropertyAccount);
            const prepared: Array<{ record: FoxproPaymentRecord; row: number }> = [];
            const accountIds = new Set<string>();

            for (let index = 0; index < records.length; index += 1) {
                const record = records[index];
                const row = index + 1;

                if (!record.accountId || !record.paymentDate) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Missing accountId or paymentDate`);
                    continue;
                }

                if (record.paymentDate < paymentCutoff) {
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

            const withRef: Array<{ record: FoxproPaymentRecord; row: number }> = [];
            const withoutRef: Array<{ record: FoxproPaymentRecord; row: number }> = [];

            for (const entry of prepared) {
                if (!accountMap.has(entry.record.accountId)) {
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
                        accountId: record.accountId,
                        paymentDate: record.paymentDate,
                        amountPaid: record.amountPaid,
                        description: record.description || '',
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
                    accountId: record.accountId,
                    paymentDate: record.paymentDate,
                    amountPaid: record.amountPaid,
                    description: record.description || '',
                    referenceNumber: null,
                };

                const existing = await paymentRepo.findOne({
                    where: {
                        accountId: record.accountId,
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

    private async saveBillingRecords(records: FoxproBillingRecord[]) {
        const result = { inserted: 0, updated: 0, skipped: 0, errors: [] as string[] };
        const startDate = this.getBillingsStartDate();

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
            accountId: string;
            paymentDate: Date;
            amountPaid: number;
            description: string;
            referenceNumber: string | null;
        },
    ): boolean {
        const existingDateKey = this.toDateKey(existing.paymentDate);
        const payloadDateKey = this.toDateKey(payload.paymentDate);

        return (
            String(existing.accountId || '') !== payload.accountId ||
            existingDateKey !== payloadDateKey ||
            Number(existing.amountPaid || 0) !== Number(payload.amountPaid || 0) ||
            (existing.description || '') !== (payload.description || '') ||
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

    private toNumber(value: unknown): number {
        if (value === null || value === undefined || value === '') {
            return 0;
        }

        const num = Number(value);
        return Number.isNaN(num) ? 0 : num;
    }
}

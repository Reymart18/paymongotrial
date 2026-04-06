import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import * as XLSX from 'xlsx';
import { Billing } from './billing.entity';
import { PropertyAccount } from '../property/property.entity';

interface BillingUploadRecord {
    accountId: string;
    billingDate?: string | Date;
    amountDue: number;
    description?: string;
}

@Injectable()
export class BillingService {
    constructor(
        @InjectRepository(Billing)
        private billingRepo: Repository<Billing>,
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
        private dataSource: DataSource,
    ) { }

    async uploadBillings(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const records = await this.parseFile(file);
        const result = {
            inserted: 0,
            skipped: 0,
            errors: [] as string[],
        };

        await this.dataSource.transaction(async (manager) => {
            const billingRepo = manager.getRepository(Billing);
            const propertyRepo = manager.getRepository(PropertyAccount);

            for (let index = 0; index < records.length; index += 1) {
                const record = records[index];
                const row = index + 1;

                if (!record.accountId || !record.amountDue) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Missing accountId or amountDue`);
                    continue;
                }

                const amountDue = Number(record.amountDue);
                if (Number.isNaN(amountDue)) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Invalid amountDue`);
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

                const billingDate = record.billingDate
                    ? new Date(record.billingDate)
                    : new Date();

                if (Number.isNaN(billingDate.getTime())) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Invalid billingDate`);
                    continue;
                }

                const billing = billingRepo.create({
                    accountId: account.accountId,
                    account,
                    billingDate,
                    amountDue,
                    description: record.description || '',
                });

                await billingRepo.save(billing);
                result.inserted += 1;
            }
        });

        return result;
    }

    private async parseFile(file: Express.Multer.File): Promise<BillingUploadRecord[]> {
        const fileName = file.originalname.toLowerCase();

        if (fileName.endsWith('.csv')) {
            return this.parseCsv(file.buffer);
        }

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            return this.parseXlsx(file.buffer);
        }

        throw new BadRequestException('Unsupported file type. Use CSV or XLSX.');
    }

    private async parseCsv(buffer: Buffer): Promise<BillingUploadRecord[]> {
        const rows: BillingUploadRecord[] = [];

        await new Promise<void>((resolve, reject) => {
            Readable.from(buffer)
                .pipe(csvParser())
                .on('data', (row) => {
                    rows.push(this.normalizeRecord(row));
                })
                .on('end', () => resolve())
                .on('error', (err) => reject(err));
        });

        return rows;
    }

    private parseXlsx(buffer: Buffer): BillingUploadRecord[] {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        return rows.map((row) => this.normalizeRecord(row as Record<string, unknown>));
    }

    private normalizeRecord(raw: Record<string, unknown>): BillingUploadRecord {
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
            billingDate: normalized.billingdate as string | Date,
            amountDue: Number(normalized.amountdue ?? 0),
            description: normalized.description ? String(normalized.description).trim() : '',
        };
    }
}

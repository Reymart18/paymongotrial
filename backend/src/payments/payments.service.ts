import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import * as XLSX from 'xlsx';
import { Payment } from './payment.entity';
import { PropertyAccount } from '../property/property.entity';
import { PropertyService } from '../property/property.service';

interface PaymentUploadRecord {
    accountId: string;
    paymentDate?: string | Date;
    amountPaid: number;
    balanceAfterPayment?: number | null;
    description?: string;
}

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(Payment)
        private paymentRepo: Repository<Payment>,
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
        private dataSource: DataSource,
        private propertyService: PropertyService,
    ) { }

    async getPaymentsByAccountId(accountId: string): Promise<Payment[]> {
        return this.paymentRepo.find({
            where: { accountId },
            order: { paymentDate: 'DESC' },
        });
    }

    async uploadPayments(file: Express.Multer.File) {
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
            const paymentRepo = manager.getRepository(Payment);
            const propertyRepo = manager.getRepository(PropertyAccount);

            for (let index = 0; index < records.length; index += 1) {
                const record = records[index];
                const row = index + 1;

                if (!record.accountId || !record.amountPaid) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Missing accountId or amountPaid`);
                    continue;
                }

                const amountPaid = Number(record.amountPaid);
                if (Number.isNaN(amountPaid)) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Invalid amountPaid`);
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

                const paymentDate = record.paymentDate
                    ? new Date(record.paymentDate)
                    : new Date();

                if (Number.isNaN(paymentDate.getTime())) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Invalid paymentDate`);
                    continue;
                }

                const currentBalance = Number(account.balance ?? 0);
                const balanceAfterPayment =
                    record.balanceAfterPayment !== undefined && record.balanceAfterPayment !== null
                        ? Number(record.balanceAfterPayment)
                        : currentBalance - amountPaid;

                if (Number.isNaN(balanceAfterPayment)) {
                    result.skipped += 1;
                    result.errors.push(`Row ${row}: Invalid balanceAfterPayment`);
                    continue;
                }

                account.balance = balanceAfterPayment;
                await propertyRepo.save(account);

                const payment = paymentRepo.create({
                    accountId: account.accountId,
                    account,
                    paymentDate,
                    amountPaid,
                    balanceAfterPayment,
                    description: record.description || '',
                });

                await paymentRepo.save(payment);
                result.inserted += 1;
            }
        });

        if (result.inserted > 0) {
            await this.propertyService.recalculateBalances();
        }

        return result;
    }

    private async parseFile(file: Express.Multer.File): Promise<PaymentUploadRecord[]> {
        const fileName = file.originalname.toLowerCase();

        if (fileName.endsWith('.csv')) {
            return this.parseCsv(file.buffer);
        }

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            return this.parseXlsx(file.buffer);
        }

        throw new BadRequestException('Unsupported file type. Use CSV or XLSX.');
    }

    private async parseCsv(buffer: Buffer): Promise<PaymentUploadRecord[]> {
        const rows: PaymentUploadRecord[] = [];

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

    private parseXlsx(buffer: Buffer): PaymentUploadRecord[] {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        return rows.map((row) => this.normalizeRecord(row as Record<string, unknown>));
    }

    private normalizeRecord(raw: Record<string, unknown>): PaymentUploadRecord {
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
            paymentDate: normalized.paymentdate as string | Date,
            amountPaid: Number(normalized.amountpaid ?? 0),
            balanceAfterPayment:
                normalized.balanceafterpayment !== undefined && normalized.balanceafterpayment !== ''
                    ? Number(normalized.balanceafterpayment)
                    : null,
            description: normalized.description ? String(normalized.description).trim() : '',
        };
    }
}

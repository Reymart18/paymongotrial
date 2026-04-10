import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoxproBilling } from '../foxpro/foxpro-billing.entity';
import { FoxproPayment } from '../foxpro/foxpro-payment.entity';
import { PropertyAccount } from '../property/property.entity';

export interface StatementRow {
    date: string;
    type: 'billing' | 'payment';
    dateFrom?: string | null;
    dateTo?: string | null;
    billDate?: string | null;
    BILLDATE?: string | null;
    referenceNumber?: string | null;
    previousBalance: number;
    amountDue: number;
    interest: number;
    penalty: number;
    amountPaid: number;
    totalBalance: number;
    description: string;
}

@Injectable()
export class StatementsService {
    constructor(
        @InjectRepository(FoxproBilling)
        private billingRepo: Repository<FoxproBilling>,
        @InjectRepository(FoxproPayment)
        private paymentRepo: Repository<FoxproPayment>,
        @InjectRepository(PropertyAccount)
        private propertyRepo: Repository<PropertyAccount>,
    ) { }

    async getStatement(accountId: string): Promise<StatementRow[]> {
        const [billings, payments] = await Promise.all([
            this.billingRepo.find({
                where: { accountId },
                order: { dueDate: 'ASC' },
            }),
            this.paymentRepo.find({
                where: { accountId },
                order: { paymentDate: 'ASC' },
            }),
        ]);

        const rows: Array<{
            dateValue: Date;
            type: 'billing' | 'payment';
            dateFromValue?: Date | null;
            dateToValue?: Date | null;
            billDateValue?: Date | null;
            referenceNumber?: string | null;
            previousBalance?: number;
            amountDue: number;
            interest: number;
            penalty: number;
            amountPaid: number;
            description: string;
        }> = [];

        for (const billing of billings) {
            if (!billing.dueDate) {
                continue;
            }
            const dateFromValue = this.toDate(billing.dateFrom);
            const dateToValue = this.toDate(billing.dateTo);
            const billDateValue = this.toDate(billing.billDate);
            rows.push({
                dateValue: new Date(billing.dueDate),
                type: 'billing',
                dateFromValue,
                dateToValue,
                billDateValue,
                previousBalance:
                    Number(billing.prinBal || 0) +
                    Number(billing.intBal || 0) +
                    Number(billing.penBal || 0),
                amountDue: Number(billing.prinCurr || 0),
                interest: Number(billing.intCurr || 0),
                penalty: Number(billing.penCurr || 0),
                amountPaid: 0,
                description: this.formatBillingDescription(billing) || 'Billing',
            });
        }

        for (const payment of payments) {
            if (!payment.paymentDate) {
                continue;
            }
            rows.push({
                dateValue: new Date(payment.paymentDate),
                type: 'payment',
                referenceNumber: payment.referenceNumber ?? null,
                amountDue: 0,
                interest: 0,
                penalty: 0,
                amountPaid: Number(payment.amountPaid || 0),
                description: payment.description || 'Payment',
            });
        }

        rows.sort((a, b) => a.dateValue.getTime() - b.dateValue.getTime());

        const statement: StatementRow[] = [];
        let runningBalance = 0;

        for (const row of rows) {
            const previousBalance =
                row.type === 'billing' && row.previousBalance !== undefined
                    ? row.previousBalance
                    : runningBalance;
            const totalBalance =
                previousBalance + row.amountDue + row.interest + row.penalty - row.amountPaid;
            runningBalance = totalBalance;

            statement.push({
                date: row.dateValue.toISOString(),
                type: row.type,
                dateFrom: row.dateFromValue ? row.dateFromValue.toISOString() : null,
                dateTo: row.dateToValue ? row.dateToValue.toISOString() : null,
                billDate:
                    row.type === 'billing' && row.billDateValue
                        ? row.billDateValue.toISOString()
                        : null,
                BILLDATE:
                    row.type === 'billing' && row.billDateValue
                        ? row.billDateValue.toISOString()
                        : null,
                referenceNumber: row.referenceNumber ?? null,
                previousBalance,
                amountDue: row.amountDue,
                interest: row.interest,
                penalty: row.penalty,
                amountPaid: row.amountPaid,
                totalBalance,
                description: row.description,
            });
        }

        const account = await this.propertyRepo.findOne({ where: { accountId } });
        if (account && Number(account.balance ?? 0) !== runningBalance) {
            account.balance = runningBalance;
            await this.propertyRepo.save(account);
        }

        return statement;
    }

    private formatBillingDescription(billing: FoxproBilling): string {
        const fromDate = this.toDate(billing.dateFrom);
        const toDate = this.toDate(billing.dateTo);

        if (fromDate && toDate) {
            const from = this.formatDate(fromDate);
            const to = this.formatDate(toDate);
            return `Billing ${from} - ${to}`;
        }

        return 'Billing';
    }

    private toDate(value: Date | string | null | undefined): Date | null {
        if (!value) {
            return null;
        }

        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return null;
        }

        return parsed;
    }

    private formatDate(value: Date): string {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

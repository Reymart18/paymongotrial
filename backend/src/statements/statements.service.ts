import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Billing } from '../billing/billing.entity';
import { Payment } from '../payments/payment.entity';

export interface MonthlyStatementRow {
    month: string;
    previousBalance: number;
    amountDue: number;
    amountPaid: number;
    totalBalance: number;
    description: string;
}

@Injectable()
export class StatementsService {
    constructor(
        @InjectRepository(Billing)
        private billingRepo: Repository<Billing>,
        @InjectRepository(Payment)
        private paymentRepo: Repository<Payment>,
    ) { }

    async getMonthlyStatement(accountId: string): Promise<MonthlyStatementRow[]> {
        const [billings, payments] = await Promise.all([
            this.billingRepo.find({
                where: { accountId },
                order: { billingDate: 'ASC' },
            }),
            this.paymentRepo.find({
                where: { accountId },
                order: { paymentDate: 'ASC' },
            }),
        ]);

        const monthMap = new Map<
            string,
            { amountDue: number; amountPaid: number; descriptions: string[] }
        >();

        const toMonthKey = (dateValue: Date) => {
            const year = dateValue.getFullYear();
            const month = String(dateValue.getMonth() + 1).padStart(2, '0');
            return `${year}-${month}`;
        };

        for (const billing of billings) {
            if (!billing.billingDate) {
                continue;
            }
            const monthKey = toMonthKey(new Date(billing.billingDate));
            const entry = monthMap.get(monthKey) || {
                amountDue: 0,
                amountPaid: 0,
                descriptions: [],
            };

            entry.amountDue += Number(billing.amountDue || 0);
            if (billing.description) {
                entry.descriptions.push(billing.description);
            }
            monthMap.set(monthKey, entry);
        }

        for (const payment of payments) {
            if (!payment.paymentDate) {
                continue;
            }
            const monthKey = toMonthKey(new Date(payment.paymentDate));
            const entry = monthMap.get(monthKey) || {
                amountDue: 0,
                amountPaid: 0,
                descriptions: [],
            };

            entry.amountPaid += Number(payment.amountPaid || 0);
            if (payment.description) {
                entry.descriptions.push(payment.description);
            }
            monthMap.set(monthKey, entry);
        }

        const months = Array.from(monthMap.keys()).sort();
        const statement: MonthlyStatementRow[] = [];

        let runningBalance = 0;

        for (const month of months) {
            const entry = monthMap.get(month);
            if (!entry) {
                continue;
            }

            const previousBalance = runningBalance;
            const totalBalance =
                previousBalance + entry.amountDue - entry.amountPaid;

            runningBalance = totalBalance;

            const description = entry.descriptions.length
                ? Array.from(new Set(entry.descriptions)).join('; ')
                : 'Monthly statement';

            statement.push({
                month,
                previousBalance,
                amountDue: entry.amountDue,
                amountPaid: entry.amountPaid,
                totalBalance,
                description,
            });
        }

        return statement;
    }
}

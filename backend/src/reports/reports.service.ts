import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoxproBilling } from '../foxpro/foxpro-billing.entity';
import { FoxproPayment } from '../foxpro/foxpro-payment.entity';
import { QuarterlyReportSnapshot } from './quarterly-report.entity';

export interface QuarterTotals {
    billed: number;
    collected: number;
    outstanding: number;
}

export interface QuarterReport {
    period: {
        year: number;
        quarter: number;
        startDate: string;
        endDate: string;
    };
    totals: QuarterTotals;
    comparison: {
        billedPercent: number | null;
        collectedPercent: number | null;
        outstandingPercent: number | null;
    };
    previousTotals: QuarterTotals;
}

export interface OverdueAccount {
    accountId: string;
    memberName: string | null;
    classification: string | null;
    neighborhood: string | null;
    block: string | null;
    lot: string | null;
    amountDue: number;
    lastPaymentDate: string | null;
    latestBillingDate: string | null;
}

export interface QuarterDueAccount {
    accountId: string;
    memberName: string | null;
    classification: string | null;
    neighborhood: string | null;
    block: string | null;
    lot: string | null;
    balanceTotal: number;
    currentChargesTotal: number;
    amountDue: number;
    lastPaymentDate: string | null;
    billingStartDate: string | null;
    billingEndDate: string | null;
}

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(FoxproBilling)
        private billingRepo: Repository<FoxproBilling>,
        @InjectRepository(FoxproPayment)
        private paymentRepo: Repository<FoxproPayment>,
        @InjectRepository(QuarterlyReportSnapshot)
        private snapshotRepo: Repository<QuarterlyReportSnapshot>,
    ) { }

    async getQuarterSummary(year: number, quarter: number): Promise<QuarterReport> {
        const { startDate, endDate } = this.getQuarterRange(year, quarter);
        const currentTotals = await this.getTotalsForRange(startDate, endDate, year, quarter);

        const { prevYear, prevQuarter } = this.getPreviousQuarter(year, quarter);
        const { startDate: prevStart, endDate: prevEnd } = this.getQuarterRange(prevYear, prevQuarter);
        const previousTotals = await this.getTotalsForRange(prevStart, prevEnd, prevYear, prevQuarter);

        return {
            period: {
                year,
                quarter,
                startDate: startDate.toISOString().slice(0, 10),
                endDate: endDate.toISOString().slice(0, 10),
            },
            totals: currentTotals,
            comparison: {
                billedPercent: this.getPercentChange(currentTotals.billed, previousTotals.billed),
                collectedPercent: this.getPercentChange(currentTotals.collected, previousTotals.collected),
                outstandingPercent: this.getPercentChange(currentTotals.outstanding, previousTotals.outstanding),
            },
            previousTotals,
        };
    }

    async getOverdueAccounts(): Promise<OverdueAccount[]> {
        const rows = await this.buildOverdueQuery().getRawMany<OverdueRow>();
        return this.mapOverdueRows(rows);
    }

    async getOverdueAccount(accountId: string): Promise<OverdueAccount | null> {
        if (!accountId) {
            return null;
        }

        const rows = await this.buildOverdueQuery(accountId).getRawMany<OverdueRow>();
        return this.mapOverdueRows(rows)[0] ?? null;
    }

    async getQuarterDueCharges(
        year: number,
        quarter: number,
    ): Promise<{ period: QuarterReport['period']; items: QuarterDueAccount[] }> {
        const { startDate, endDate } = this.getQuarterRange(year, quarter);
        const startKey = startDate.toISOString().slice(0, 10);
        const endKey = endDate.toISOString().slice(0, 10);

        const [billings, payments] = await Promise.all([
            this.billingRepo.find({ relations: ['account'], order: { dueDate: 'DESC' } }),
            this.paymentRepo.find(),
        ]);

        const parseDate = (value: unknown) => {
            if (!value) {
                return null;
            }
            const date = value instanceof Date ? value : new Date(value as string);
            return Number.isNaN(date.getTime()) ? null : date;
        };

        const dateKey = (value: unknown) => {
            const parsed = parseDate(value);
            return parsed ? parsed.toISOString().slice(0, 10) : null;
        };

        const toCents = (value: unknown) => Math.round(Number(value || 0) * 100);

        const latestBillingsByAccount = new Map<string, FoxproBilling>();
        for (const billing of billings) {
            const accountId = billing.accountId;
            if (!accountId) {
                continue;
            }

            const billingKey = dateKey(billing.dateTo || billing.dateFrom || billing.dueDate);
            if (!billingKey || billingKey < startKey || billingKey > endKey) {
                continue;
            }

            const existing = latestBillingsByAccount.get(accountId);
            if (!existing) {
                latestBillingsByAccount.set(accountId, billing);
                continue;
            }

            const existingKey = dateKey(existing.dateTo || existing.dateFrom || existing.dueDate);
            if (!existingKey || billingKey > existingKey) {
                latestBillingsByAccount.set(accountId, billing);
            }
        }

        const paymentsByAccount = new Map<string, FoxproPayment[]>();
        for (const payment of payments) {
            if (!payment.accountId) {
                continue;
            }

            if (!paymentsByAccount.has(payment.accountId)) {
                paymentsByAccount.set(payment.accountId, []);
            }
            paymentsByAccount.get(payment.accountId)?.push(payment);
        }

        const items: QuarterDueAccount[] = [];
        for (const [accountId, billing] of latestBillingsByAccount) {
            const principalBalance = Number(billing?.prinBal || 0);
            const interestBalance = Number(billing?.intBal || 0);
            const penaltyBalance = Number(billing?.penBal || 0);
            const balanceTotal = principalBalance + interestBalance + penaltyBalance;

            const currentPrincipal = Number(billing?.prinCurr || 0);
            const currentInterest = Number(billing?.intCurr || 0);
            const currentPenalty = Number(billing?.penCurr || 0);
            const currentChargesTotal = currentPrincipal + currentInterest + currentPenalty;

            if (toCents(currentChargesTotal) <= 0) {
                continue;
            }

            let membershipPayments = 0;
            const billingStart = billing?.dateFrom ? new Date(billing.dateFrom) : null;
            const billingEnd = billing?.dateTo ? new Date(billing.dateTo) : null;

            if (billingStart && billingEnd && !Number.isNaN(billingStart.getTime()) && !Number.isNaN(billingEnd.getTime())) {
                const accountPayments = paymentsByAccount.get(accountId) || [];
                for (const payment of accountPayments) {
                    if (!payment.paymentDate) {
                        continue;
                    }
                    const paymentDate = new Date(payment.paymentDate);
                    if (!Number.isNaN(paymentDate.getTime()) && paymentDate >= billingStart && paymentDate <= billingEnd) {
                        const paycat = String(payment.paycat || '').trim().toLowerCase();
                        if (paycat === 'membership dues') {
                            membershipPayments += Number(payment.amountPaid || 0);
                        }
                    }
                }
            }

            const amountDue = balanceTotal + currentChargesTotal - membershipPayments;
            if (toCents(amountDue) <= 5000) {
                continue;
            }

            const accountPayments = paymentsByAccount.get(accountId) || [];
            const lastPaymentDate = accountPayments.reduce<Date | null>((latest, payment) => {
                const parsed = parseDate(payment.paymentDate);
                if (!parsed) {
                    return latest;
                }
                if (!latest || parsed > latest) {
                    return parsed;
                }
                return latest;
            }, null);

            items.push({
                accountId,
                memberName: billing.account?.memberName ?? null,
                classification: billing.account?.classification ?? null,
                neighborhood: billing.account?.neighborhood ?? null,
                block: billing.account?.block ?? null,
                lot: billing.account?.lot ?? null,
                balanceTotal,
                currentChargesTotal,
                amountDue,
                lastPaymentDate: lastPaymentDate ? lastPaymentDate.toISOString().slice(0, 10) : null,
                billingStartDate: billing?.dateFrom ? dateKey(billing.dateFrom) : null,
                billingEndDate: billing?.dateTo ? dateKey(billing.dateTo) : null,
            });
        }

        items.sort((a, b) => a.accountId.localeCompare(b.accountId, 'en', { numeric: true }));

        return {
            period: {
                year,
                quarter,
                startDate: startKey,
                endDate: endKey,
            },
            items,
        };
    }

    private async getTotalsForRange(
        startDate: Date,
        endDate: Date,
        year: number,
        quarter: number,
    ): Promise<QuarterTotals> {
        const start = startDate.toISOString().slice(0, 10);
        const end = endDate.toISOString().slice(0, 10);

        const billedResult = await this.billingRepo
            .createQueryBuilder('billing')
            .select(
                'COALESCE(SUM(billing.prinCurr + billing.intCurr + billing.penCurr), 0)',
                'total',
            )
            .where('COALESCE(billing.dateFrom, billing.dateTo) <= :end', { end })
            .andWhere('COALESCE(billing.dateTo, billing.dateFrom) >= :start', { start })
            .getRawOne();

        const collectedResult = await this.paymentRepo
            .createQueryBuilder('payment')
            .select('COALESCE(SUM(payment.amountPaid), 0)', 'total')
            .where('payment.paymentDate >= :start', { start })
            .andWhere('payment.paymentDate <= :end', { end })
            .andWhere("LOWER(payment.paycat) = 'membership dues'")
            .getRawOne();

        let billed = Number(billedResult?.total || 0);
        const collected = Number(collectedResult?.total || 0);

        if (billed === 0) {
            const snapshot = await this.snapshotRepo.findOne({ where: { year, quarter } });
            if (snapshot?.billedTotal) {
                billed = Number(snapshot.billedTotal);
            }
        }

        return {
            billed,
            collected,
            outstanding: billed - collected,
        };
    }

    private getPercentChange(current: number, previous: number): number | null {
        if (previous === 0) {
            return null;
        }

        const denominator = Math.abs(previous);
        return ((current - previous) / denominator) * 100;
    }

    private getPreviousQuarter(year: number, quarter: number) {
        if (quarter === 1) {
            return { prevYear: year - 1, prevQuarter: 4 };
        }

        return { prevYear: year, prevQuarter: quarter - 1 };
    }

    private getQuarterRange(year: number, quarter: number) {
        const startMonth = (quarter - 1) * 3;
        const startDate = new Date(Date.UTC(year, startMonth, 1));
        const endDate = new Date(Date.UTC(year, startMonth + 3, 0));
        return { startDate, endDate };
    }

    private getAnnualCharge(currentCharges: number): number | null {
        if (currentCharges <= 0) {
            return null;
        }

        return currentCharges * 12;
    }

    private isAnnualBalanceMatch(previousBalance: number, annualCharge: number | null): boolean {
        if (!annualCharge || previousBalance <= 0) {
            return false;
        }

        const tolerance = Math.max(annualCharge * 0.05, 1);
        return previousBalance + tolerance >= annualCharge;
    }

    private buildOverdueQuery(accountId?: string) {
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - 1);
        const cutoffKey = cutoff.toISOString().slice(0, 10);

        const latestBillingSub = this.billingRepo
            .createQueryBuilder('billing')
            .select('billing.accountId', 'accountId')
            .addSelect('MAX(COALESCE(billing.dateTo, billing.dateFrom))', 'latestDate')
            .groupBy('billing.accountId');

        const query = this.billingRepo
            .createQueryBuilder('billing')
            .innerJoin(
                `(${latestBillingSub.getQuery()})`,
                'latest',
                'latest.accountId = billing.accountId AND COALESCE(billing.dateTo, billing.dateFrom) = latest.latestDate',
            )
            .leftJoin(FoxproPayment, 'payment', 'payment.accountId = billing.accountId')
            .leftJoin('billing.account', 'account')
            .setParameters({
                ...latestBillingSub.getParameters(),
                cutoff: cutoffKey,
                accountId,
            })
            .select('billing.accountId', 'accountId')
            .addSelect('account.memberName', 'memberName')
            .addSelect('account.classification', 'classification')
            .addSelect('account.neighborhood', 'neighborhood')
            .addSelect('account.block', 'block')
            .addSelect('account.lot', 'lot')
            .addSelect(
                'COALESCE(billing.prinBal, 0) + COALESCE(billing.intBal, 0) + COALESCE(billing.penBal, 0)',
                'previousBalance',
            )
            .addSelect(
                'COALESCE(billing.prinCurr, 0)',
                'currentCharges',
            )
            .addSelect(
                "SUM(CASE WHEN payment.paymentDate <= latest.latestDate AND LOWER(payment.paycat) = 'membership dues' THEN payment.amountPaid ELSE 0 END)",
                'paymentsToDate',
            )
            .addSelect('MAX(payment.paymentDate)', 'lastPaymentDate')
            .addSelect('COALESCE(billing.dateTo, billing.dateFrom)', 'latestBillingDate')
            .groupBy('billing.accountId')
            .addGroupBy('account.memberName')
            .addGroupBy('account.classification')
            .addGroupBy('account.neighborhood')
            .addGroupBy('account.block')
            .addGroupBy('account.lot')
            .addGroupBy('latest.latestDate')
            .addGroupBy('billing.prinBal')
            .addGroupBy('billing.intBal')
            .addGroupBy('billing.penBal')
            .addGroupBy('billing.prinCurr')
            .having('MAX(payment.paymentDate) IS NULL OR MAX(payment.paymentDate) <= :cutoff')
            .orderBy('previousBalance', 'DESC');

        if (accountId) {
            query.andWhere('billing.accountId = :accountId');
        }

        return query;
    }

    private mapOverdueRows(rows: OverdueRow[]): OverdueAccount[] {
        return rows
            .map((row) => {
                const previousBalance = Number(row.previousBalance || 0);
                const currentCharges = Number(row.currentCharges || 0);
                const paymentsToDate = Number(row.paymentsToDate || 0);
                const amountDue = previousBalance + currentCharges - paymentsToDate;

                const annualCharge = this.getAnnualCharge(currentCharges);
                const annualOk = this.isAnnualBalanceMatch(previousBalance, annualCharge);

                return {
                    accountId: row.accountId,
                    memberName: row.memberName,
                    classification: row.classification ?? null,
                    neighborhood: row.neighborhood,
                    block: row.block,
                    lot: row.lot,
                    amountDue,
                    lastPaymentDate: row.lastPaymentDate ?? null,
                    latestBillingDate: row.latestBillingDate ?? null,
                    annualOk,
                };
            })
            .filter((row) => row.amountDue > 0 && row.annualOk)
            .map(({ annualOk, ...row }) => row);
    }
}

type OverdueRow = {
    accountId: string;
    memberName: string | null;
    classification?: string | null;
    neighborhood: string | null;
    block: string | null;
    lot: string | null;
    previousBalance: string | number;
    currentCharges: string | number;
    paymentsToDate: string | number;
    lastPaymentDate: string | null;
    latestBillingDate: string | null;
};

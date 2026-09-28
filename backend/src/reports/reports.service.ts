import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoxproBilling } from '../foxpro/foxpro-billing.entity';
import { FoxproPayment } from '../foxpro/foxpro-payment.entity';
import { PropertyAccount } from '../property/property.entity';
import { QuarterlyReportSnapshot } from './quarterly-report.entity';

export interface QuarterTotals { billed: number; collected: number; outstanding: number; }
export interface QuarterReport {
    period: { year: number; quarter: number; startDate: string; endDate: string; };
    totals: QuarterTotals;
    comparison: { billedPercent: number | null; collectedPercent: number | null; outstandingPercent: number | null; };
    previousTotals: QuarterTotals;
}
export interface OverdueAccount {
    accountId: string; memberName: string | null; classification: string | null;
    neighborhood: string | null; block: string | null; lot: string | null;
    amountDue: number; lastPaymentDate: string | null; latestBillingDate: string | null;
}
export interface QuarterDueAccount {
    accountId: string; memberName: string | null; classification: string | null;
    neighborhood: string | null; block: string | null; lot: string | null;
    balanceTotal: number; currentChargesTotal: number; amountDue: number;
    lastPaymentDate: string | null; billingStartDate: string | null; billingEndDate: string | null;
}

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(FoxproBilling) private billingRepo: Repository<FoxproBilling>,
        @InjectRepository(FoxproPayment) private paymentRepo: Repository<FoxproPayment>,
        @InjectRepository(PropertyAccount) private propertyRepo: Repository<PropertyAccount>,
        @InjectRepository(QuarterlyReportSnapshot) private snapshotRepo: Repository<QuarterlyReportSnapshot>,
    ) { }

    async getQuarterSummary(year: number, quarter: number): Promise<QuarterReport> {
        const range = this.getQuarterRange(year, quarter);
        const totals = await this.getTotalsForRange(range.startDate, range.endDate, year, quarter);
        const previous = this.getPreviousQuarter(year, quarter);
        const previousRange = this.getQuarterRange(previous.prevYear, previous.prevQuarter);
        const previousTotals = await this.getTotalsForRange(
            previousRange.startDate, previousRange.endDate, previous.prevYear, previous.prevQuarter,
        );
        return {
            period: { year, quarter, startDate: this.dateKey(range.startDate), endDate: this.dateKey(range.endDate) },
            totals,
            comparison: {
                billedPercent: this.getPercentChange(totals.billed, previousTotals.billed),
                collectedPercent: this.getPercentChange(totals.collected, previousTotals.collected),
                outstandingPercent: this.getPercentChange(totals.outstanding, previousTotals.outstanding),
            },
            previousTotals,
        };
    }

    async getOverdueAccounts(): Promise<OverdueAccount[]> { return this.getOverdueAccountsFromRecords(); }

    async getOverdueAccount(accountId: string): Promise<OverdueAccount | null> {
        return accountId ? (await this.getOverdueAccountsFromRecords(accountId))[0] ?? null : null;
    }

    async getQuarterDueCharges(year: number, quarter: number): Promise<{ period: QuarterReport['period']; items: QuarterDueAccount[] }> {
        const range = this.getQuarterRange(year, quarter);
        const startKey = this.dateKey(range.startDate);
        const endKey = this.dateKey(range.endDate);
        const [accounts, billings, payments] = await Promise.all([
            this.propertyRepo.find(),
            this.billingRepo.find({ order: { dueDate: 'DESC' } }),
            this.paymentRepo.find({ where: { isDeletedFromFoxpro: false } }),
        ]);
        const billingByAccount = this.latestBillingsByAccount(billings, startKey, endKey);
        const paymentsByAccount = this.paymentsByAccount(payments);
        const items: QuarterDueAccount[] = [];
        for (const account of accounts) {
            const accountId = account.accountId || '';
            const billing = billingByAccount.get(accountId);
            if (!accountId || !billing) continue;
            const currentChargesTotal = this.currentCharges(billing);
            const amountDue = Number(account.balance ?? 0);
            if (currentChargesTotal <= 0 || amountDue <= 0) continue;
            items.push({
                accountId, memberName: account.memberName ?? null, classification: account.classification ?? null,
                neighborhood: account.neighborhood ?? null, block: account.block ?? null, lot: account.lot ?? null,
                balanceTotal: amountDue, currentChargesTotal, amountDue,
                lastPaymentDate: this.lastPaymentDate(paymentsByAccount.get(accountId) || []),
                billingStartDate: this.dateKeyOrNull(billing.dateFrom), billingEndDate: this.dateKeyOrNull(billing.dateTo),
            });
        }
        return {
            period: { year, quarter, startDate: startKey, endDate: endKey },
            items: items.sort((a, b) => a.accountId.localeCompare(b.accountId, 'en', { numeric: true })),
        };
    }

    private async getTotalsForRange(startDate: Date, endDate: Date, year: number, quarter: number): Promise<QuarterTotals> {
        const start = this.dateKey(startDate);
        const end = this.dateKey(endDate);
        const [billedResult, collectedResult] = await Promise.all([
            this.billingRepo.createQueryBuilder('billing')
                .select('COALESCE(SUM(billing.prinCurr + billing.intCurr + billing.penCurr), 0)', 'total')
                .where('COALESCE(billing.dateFrom, billing.dateTo) <= :end', { end })
                .andWhere('COALESCE(billing.dateTo, billing.dateFrom) >= :start', { start }).getRawOne(),
            this.paymentRepo.createQueryBuilder('payment').select('COALESCE(SUM(payment.amountPaid), 0)', 'total')
                .where('payment.paymentDate >= :start', { start }).andWhere('payment.paymentDate <= :end', { end })
                .andWhere("LOWER(payment.paycat) = 'membership dues'")
                .andWhere('(payment.isDeletedFromFoxpro = false OR payment.isDeletedFromFoxpro IS NULL)').getRawOne(),
        ]);
        let billed = Number(billedResult?.total || 0);
        if (billed === 0) billed = Number((await this.snapshotRepo.findOne({ where: { year, quarter } }))?.billedTotal || 0);
        const collected = Number(collectedResult?.total || 0);
        return { billed, collected, outstanding: billed - collected };
    }

    private async getOverdueAccountsFromRecords(accountId?: string): Promise<OverdueAccount[]> {
        const [accounts, billings, payments] = await Promise.all([
            this.propertyRepo.find({ where: accountId ? { accountId } : undefined }),
            this.billingRepo.find({ where: accountId ? { accountId } : undefined, order: { dueDate: 'DESC' } }),
            this.paymentRepo.find({ where: accountId ? { accountId, isDeletedFromFoxpro: false } : { isDeletedFromFoxpro: false } }),
        ]);
        const billingByAccount = this.latestBillingsByAccount(billings);
        const paymentsByAccount = this.paymentsByAccount(payments);
        const items: OverdueAccount[] = [];
        for (const account of accounts) {
            const id = account.accountId || '';
            const billing = billingByAccount.get(id);
            const amountDue = Number(account.balance ?? 0);
            if (!id || !billing || !this.isAnnualBalanceMatch(amountDue, this.getAnnualCharge(this.currentCharges(billing)))) continue;
            items.push({
                accountId: id, memberName: account.memberName ?? null, classification: account.classification ?? null,
                neighborhood: account.neighborhood ?? null, block: account.block ?? null, lot: account.lot ?? null,
                amountDue, lastPaymentDate: this.lastPaymentDate(paymentsByAccount.get(id) || []),
                latestBillingDate: this.dateKeyOrNull(billing.dateTo || billing.dateFrom || billing.dueDate),
            });
        }
        return items.sort((a, b) => b.amountDue - a.amountDue);
    }

    private latestBillingsByAccount(billings: FoxproBilling[], startKey?: string, endKey?: string) {
        const result = new Map<string, FoxproBilling>();
        for (const billing of billings) {
            const accountId = billing.accountId || '';
            const key = this.dateKeyOrNull(billing.dateTo || billing.dateFrom || billing.dueDate);
            if (!accountId || !key || (startKey && endKey && (key < startKey || key > endKey))) continue;
            const existing = result.get(accountId);
            const existingKey = existing ? this.dateKeyOrNull(existing.dateTo || existing.dateFrom || existing.dueDate) : null;
            if (!existing || !existingKey || key > existingKey) result.set(accountId, billing);
        }
        return result;
    }

    private paymentsByAccount(payments: FoxproPayment[]) {
        const result = new Map<string, FoxproPayment[]>();
        for (const payment of payments) {
            if (!payment.accountId) continue;
            result.set(payment.accountId, [...(result.get(payment.accountId) || []), payment]);
        }
        return result;
    }

    private lastPaymentDate(payments: FoxproPayment[]): string | null {
        const latest = payments.reduce<Date | null>((current, payment) => {
            const paycat = String(payment.paycat || '').trim().toLowerCase();
            if (paycat !== 'membership dues') {
                return current;
            }

            const date = this.toDate(payment.paymentDate);
            return date && (!current || date > current) ? date : current;
        }, null);
        return latest ? this.dateKey(latest) : null;
    }

    private currentCharges(billing: FoxproBilling): number {
        return Number(billing.prinCurr || 0) + Number(billing.intCurr || 0) + Number(billing.penCurr || 0);
    }
    private getAnnualCharge(currentCharges: number): number | null { return currentCharges > 0 ? currentCharges * 4 : null; }
    private isAnnualBalanceMatch(amountDue: number, annualCharge: number | null): boolean { return Boolean(annualCharge && amountDue > 0 && amountDue >= annualCharge); }
    private getPercentChange(current: number, previous: number): number | null { return previous === 0 ? null : ((current - previous) / Math.abs(previous)) * 100; }
    private getPreviousQuarter(year: number, quarter: number) { return quarter === 1 ? { prevYear: year - 1, prevQuarter: 4 } : { prevYear: year, prevQuarter: quarter - 1 }; }
    private getQuarterRange(year: number, quarter: number) { const month = (quarter - 1) * 3; return { startDate: new Date(Date.UTC(year, month, 1)), endDate: new Date(Date.UTC(year, month + 3, 0)) }; }
    private toDate(value: Date | string | null | undefined): Date | null { if (!value) return null; const date = value instanceof Date ? value : new Date(value); return Number.isNaN(date.getTime()) ? null : date; }
    private dateKeyOrNull(value: Date | string | null | undefined): string | null { const date = this.toDate(value); return date ? this.dateKey(date) : null; }
    private dateKey(date: Date): string { return date.toISOString().slice(0, 10); }
}

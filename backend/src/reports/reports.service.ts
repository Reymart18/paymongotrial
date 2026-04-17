import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FoxproBilling } from '../foxpro/foxpro-billing.entity';
import { FoxproPayment } from '../foxpro/foxpro-payment.entity';

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

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(FoxproBilling)
        private billingRepo: Repository<FoxproBilling>,
        @InjectRepository(FoxproPayment)
        private paymentRepo: Repository<FoxproPayment>,
    ) { }

    async getQuarterSummary(year: number, quarter: number): Promise<QuarterReport> {
        const { startDate, endDate } = this.getQuarterRange(year, quarter);
        const currentTotals = await this.getTotalsForRange(startDate, endDate);

        const { prevYear, prevQuarter } = this.getPreviousQuarter(year, quarter);
        const { startDate: prevStart, endDate: prevEnd } = this.getQuarterRange(prevYear, prevQuarter);
        const previousTotals = await this.getTotalsForRange(prevStart, prevEnd);

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

    private async getTotalsForRange(startDate: Date, endDate: Date): Promise<QuarterTotals> {
        const start = startDate.toISOString().slice(0, 10);
        const end = endDate.toISOString().slice(0, 10);

        const billedResult = await this.billingRepo
            .createQueryBuilder('billing')
            .select(
                'COALESCE(SUM(billing.prinCurr + billing.intCurr + billing.penCurr), 0)',
                'total',
            )
            .where('billing.dateFrom >= :start', { start })
            .andWhere('billing.dateFrom <= :end', { end })
            .getRawOne();

        const collectedResult = await this.paymentRepo
            .createQueryBuilder('payment')
            .select('COALESCE(SUM(payment.amountPaid), 0)', 'total')
            .where('payment.paymentDate >= :start', { start })
            .andWhere('payment.paymentDate <= :end', { end })
            .getRawOne();

        const billed = Number(billedResult?.total || 0);
        const collected = Number(collectedResult?.total || 0);

        return {
            billed,
            collected,
            outstanding: billed - collected,
        };
    }

    private getPercentChange(current: number, previous: number): number | null {
        if (previous <= 0) {
            return null;
        }

        return ((current - previous) / previous) * 100;
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
}

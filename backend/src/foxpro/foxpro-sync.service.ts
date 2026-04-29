import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { FoxproService } from './foxpro.service';

@Injectable()
export class FoxproSyncService {
    private readonly logger = new Logger(FoxproSyncService.name);
    private isPaymentRunning = false;
    private lastPaymentRun = 0;
    private isBillingRunning = false;
    private lastBillingRun = 0;
    private lastBillingMtime = 0;

    constructor(private foxproService: FoxproService) { }

    @Interval(60000)
    async syncPayments() {
        const intervalMs = this.getSyncIntervalMs();
        const now = Date.now();
        if (now - this.lastPaymentRun < intervalMs) {
            return;
        }

        if (this.isPaymentRunning) {
            this.logger.warn('Sync skipped: previous run still in progress.');
            return;
        }

        this.isPaymentRunning = true;
        this.lastPaymentRun = now;

        try {
            const result = await this.foxproService.syncPaymentsFromDbf();
            this.logger.log(
                `Sync complete: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped.`,
            );
        } catch (error) {
            const detail = error instanceof Error ? error.stack : String(error);
            this.logger.error('Sync failed.', detail);
        } finally {
            this.isPaymentRunning = false;
        }
    }

    @Interval(60000)
    async syncBillings() {
        const intervalMs = this.getBillingsSyncIntervalMs();
        const now = Date.now();
        if (now - this.lastBillingRun < intervalMs) {
            return;
        }

        const billingDbfPath = this.getBillingsDbfPath();
        if (!fs.existsSync(billingDbfPath)) {
            this.logger.warn(`Billing sync skipped: DBF not found at ${billingDbfPath}`);
            return;
        }

        const { mtimeMs } = fs.statSync(billingDbfPath);
        if (this.lastBillingMtime && mtimeMs === this.lastBillingMtime) {
            return;
        }

        if (this.isBillingRunning) {
            this.logger.warn('Billing sync skipped: previous run still in progress.');
            return;
        }

        this.isBillingRunning = true;
        this.lastBillingRun = now;

        try {
            const result = await this.foxproService.syncBillingsFromDbf();
            this.logger.log(
                `Billing sync complete: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped.`,
            );
            this.lastBillingMtime = mtimeMs;
        } catch (error) {
            const detail = error instanceof Error ? error.stack : String(error);
            this.logger.error('Billing sync failed.', detail);
        } finally {
            this.isBillingRunning = false;
        }
    }

    private getSyncIntervalMs(): number {
        const configured = Number(process.env.FOXPRO_PAYMENTS_SYNC_INTERVAL_MS);
        if (!Number.isNaN(configured) && configured > 0) {
            return configured;
        }

        return 60000;
    }

    private getBillingsSyncIntervalMs(): number {
        const configured = Number(process.env.FOXPRO_BILLINGS_SYNC_INTERVAL_MS);
        if (!Number.isNaN(configured) && configured > 0) {
            return configured;
        }

        return 60000;
    }

    private getBillingsDbfPath(): string {
        if (process.env.FOXPRO_BILLINGS_DBF_PATH) {
            return process.env.FOXPRO_BILLINGS_DBF_PATH;
        }

        return path.resolve('C:/Users/CLienT/Documents/hoaportal/BILLING.DBF');
    }
}

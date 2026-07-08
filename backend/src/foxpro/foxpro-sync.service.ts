import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { FoxproService } from './foxpro.service';
import { isLocalDbfMode } from '../sync/sync-mode.util';

@Injectable()
export class FoxproSyncService {
    private readonly logger = new Logger(FoxproSyncService.name);
    private isPaymentRunning = false;
    private lastPaymentRun = 0;

    constructor(private foxproService: FoxproService) { }

    @Interval(60000)
    async syncPayments() {
        if (!isLocalDbfMode()) {
            return;
        }

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


    private getSyncIntervalMs(): number {
        const configured = Number(process.env.FOXPRO_PAYMENTS_SYNC_INTERVAL_MS);
        if (!Number.isNaN(configured) && configured > 0) {
            return configured;
        }

        return 60000;
    }

    // Billing sync now runs only via the manual sync endpoint.
}

import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { FoxproService } from './foxpro.service';

@Injectable()
export class FoxproSyncService {
    private readonly logger = new Logger(FoxproSyncService.name);
    private isRunning = false;
    private lastRun = 0;

    constructor(private foxproService: FoxproService) { }

    @Interval(60000)
    async syncPayments() {
        const intervalMs = this.getSyncIntervalMs();
        const now = Date.now();
        if (now - this.lastRun < intervalMs) {
            return;
        }

        if (this.isRunning) {
            this.logger.warn('Sync skipped: previous run still in progress.');
            return;
        }

        this.isRunning = true;
        this.lastRun = now;

        try {
            const result = await this.foxproService.syncPaymentsFromDbf();
            this.logger.log(
                `Sync complete: ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped.`,
            );
        } catch (error) {
            const detail = error instanceof Error ? error.stack : String(error);
            this.logger.error('Sync failed.', detail);
        } finally {
            this.isRunning = false;
        }
    }

    private getSyncIntervalMs(): number {
        const configured = Number(process.env.FOXPRO_PAYMENTS_SYNC_INTERVAL_MS);
        if (!Number.isNaN(configured) && configured > 0) {
            return configured;
        }

        return 60000;
    }
}

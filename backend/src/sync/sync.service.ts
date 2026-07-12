import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { FoxproService } from '../foxpro/foxpro.service';
import { SyncRequest, SyncRequestType } from './sync-request.entity';
import { getSyncMode } from './sync-mode.util';

type SyncResult = {
    inserted?: number;
    updated?: number;
    deleted?: number;
    skipped?: number;
    errors?: string[];
};

@Injectable()
export class SyncService {
    private lastServerPollAt: Date | null = null;

    constructor(
        @InjectRepository(SyncRequest)
        private syncRequestRepo: Repository<SyncRequest>,
        private dataSource: DataSource,
        private foxproService: FoxproService,
    ) { }

    async createRequest(type: SyncRequestType, requestedBy: string) {
        const existing = await this.syncRequestRepo.findOne({
            where: {
                type,
                status: In(['pending', 'processing']),
            },
            order: { requestedAt: 'DESC' },
        });

        if (existing) {
            throw new BadRequestException(`A ${type} sync request is already ${existing.status}.`);
        }

        const request = this.syncRequestRepo.create({
            type,
            status: 'pending',
            requestedBy,
            requestedAt: new Date(),
            recordsProcessed: 0,
            recordsUpdated: 0,
            errorMessage: null,
        });

        return this.syncRequestRepo.save(request);
    }

    async getPendingRequests() {
        this.lastServerPollAt = new Date();
        return this.syncRequestRepo.find({
            where: { status: 'pending' },
            order: { requestedAt: 'ASC' },
        });
    }

    async startRequest(id: number) {
        return this.dataSource.transaction(async (manager) => {
            const repo = manager.getRepository(SyncRequest);
            const request = await repo.findOne({ where: { id } });
            if (!request) {
                throw new NotFoundException('Sync request not found.');
            }

            if (request.status !== 'pending') {
                throw new BadRequestException(`Sync request is already ${request.status}.`);
            }

            const running = await repo.findOne({ where: { status: 'processing' } });
            if (running) {
                throw new BadRequestException('Another sync job is already processing.');
            }

            request.status = 'processing';
            request.startedAt = new Date();
            request.errorMessage = null;
            return repo.save(request);
        });
    }

    async completeRequest(id: number, recordsProcessed = 0, recordsUpdated = 0) {
        const request = await this.getRequestOrFail(id);
        request.status = 'completed';
        request.completedAt = new Date();
        request.errorMessage = null;
        request.recordsProcessed = this.toNonNegativeInt(recordsProcessed);
        request.recordsUpdated = this.toNonNegativeInt(recordsUpdated);
        return this.syncRequestRepo.save(request);
    }

    async failRequest(id: number, errorMessage: string, recordsProcessed = 0, recordsUpdated = 0) {
        const request = await this.getRequestOrFail(id);
        request.status = 'failed';
        request.completedAt = new Date();
        request.errorMessage = errorMessage || 'Sync failed.';
        request.recordsProcessed = this.toNonNegativeInt(recordsProcessed);
        request.recordsUpdated = this.toNonNegativeInt(recordsUpdated);
        return this.syncRequestRepo.save(request);
    }

    async receiveMembers(body: unknown) {
        const { records, requestId } = this.resolvePayload(body);
        const result = await this.foxproService.syncMembersFromJson(records);
        return this.recordReceiveResult('members', records.length, result, requestId);
    }

    async receivePayments(body: unknown) {
        const { records, requestId } = this.resolvePayload(body);
        const result = await this.foxproService.syncPaymentsFromJson(records);
        return this.recordReceiveResult('payments', records.length, result, requestId);
    }

    async reconcilePayments(body: unknown) {
        const payload = body as { referenceNumbers?: unknown };
        if (!Array.isArray(payload?.referenceNumbers)) {
            throw new BadRequestException('Payment reconciliation requires a referenceNumbers array.');
        }

        return this.foxproService.reconcilePaymentsFromJson(payload.referenceNumbers);
    }

    async receiveBillings(body: unknown) {
        const { records, requestId } = this.resolvePayload(body);
        const result = await this.foxproService.syncBillingsFromJson(records);
        return this.recordReceiveResult('billing', records.length, result, requestId);
    }

    async getStatus() {
        const [running, latest] = await Promise.all([
            this.syncRequestRepo.findOne({
                where: { status: 'processing' },
                order: { startedAt: 'DESC' },
            }),
            this.syncRequestRepo.findOne({
                where: { status: In(['completed', 'failed', 'processing', 'pending']) },
                order: { requestedAt: 'DESC' },
            }),
        ]);
        const display = running || latest;
        const offlineAfterSeconds = Number(process.env.SYNC_SERVER_OFFLINE_AFTER_SECONDS || 30);
        const serverOnline = Boolean(
            this.lastServerPollAt
            && Date.now() - this.lastServerPollAt.getTime() <= offlineAfterSeconds * 1000,
        );

        return {
            syncMode: getSyncMode(),
            serverStatus: serverOnline ? 'online' : 'offline',
            lastServerPollAt: this.lastServerPollAt,
            syncStatus: display?.status || 'idle',
            lastSyncTime: display?.completedAt || display?.startedAt || display?.requestedAt || null,
            lastSyncedTable: display?.type || null,
            recordsUpdated: display?.recordsUpdated || 0,
            recordsProcessed: display?.recordsProcessed || 0,
            errorMessage: display?.errorMessage || null,
            activeRequestId: running?.id || null,
        };
    }

    private async recordReceiveResult(
        type: SyncRequestType,
        recordsProcessed: number,
        result: SyncResult,
        requestId?: number,
    ) {
        const recordsUpdated =
            Number(result.inserted || 0) +
            Number(result.updated || 0) +
            Number(result.deleted || 0);

        if (requestId) {
            const request = await this.getRequestOrFail(requestId);
            if (request.type !== type) {
                throw new BadRequestException('Sync request type does not match payload type.');
            }
            request.recordsProcessed = recordsProcessed;
            request.recordsUpdated = recordsUpdated;
            await this.syncRequestRepo.save(request);
        } else {
            const autoRequest = this.syncRequestRepo.create({
                type,
                status: 'completed',
                requestedBy: 'server_pc_auto_sync',
                requestedAt: new Date(),
                startedAt: new Date(),
                completedAt: new Date(),
                recordsProcessed,
                recordsUpdated,
                errorMessage: null,
            });
            await this.syncRequestRepo.save(autoRequest);
        }

        return {
            ...result,
            recordsProcessed,
            recordsUpdated,
        };
    }

    private resolvePayload(body: unknown): { records: Array<Record<string, unknown>>; requestId?: number } {
        const payload = body as { records?: unknown; requestId?: unknown } | Array<Record<string, unknown>>;
        const records = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.records)
                ? payload.records
                : null;

        if (!records) {
            throw new BadRequestException('Sync payload must be an array or an object with a records array.');
        }

        const requestId = !Array.isArray(payload) && payload.requestId !== undefined
            ? Number(payload.requestId)
            : undefined;

        if (requestId !== undefined && !Number.isFinite(requestId)) {
            throw new BadRequestException('Invalid sync request ID.');
        }

        return { records: records as Array<Record<string, unknown>>, requestId };
    }

    private async getRequestOrFail(id: number) {
        if (!Number.isFinite(id)) {
            throw new BadRequestException('Invalid sync request ID.');
        }

        const request = await this.syncRequestRepo.findOne({ where: { id } });
        if (!request) {
            throw new NotFoundException('Sync request not found.');
        }

        return request;
    }

    private toNonNegativeInt(value: unknown): number {
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
            return 0;
        }

        return Math.floor(parsed);
    }
}

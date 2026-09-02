import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type SyncRequestType = 'members' | 'payments' | 'billing' | 'adjustments';
export type SyncRequestStatus = 'pending' | 'processing' | 'completed' | 'failed';

@Entity({ name: 'sync_requests' })
@Index(['type', 'status'])
export class SyncRequest {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'varchar', length: 20 })
    type?: SyncRequestType;

    @Column({ type: 'varchar', length: 20, default: 'pending' })
    status?: SyncRequestStatus;

    @Column({ name: 'requested_by', type: 'varchar', length: 100, nullable: true })
    requestedBy?: string | null;

    @Column({ name: 'requested_at', type: 'datetime' })
    requestedAt?: Date;

    @Column({ name: 'started_at', type: 'datetime', nullable: true })
    startedAt?: Date | null;

    @Column({ name: 'completed_at', type: 'datetime', nullable: true })
    completedAt?: Date | null;

    @Column({ name: 'error_message', type: 'text', nullable: true })
    errorMessage?: string | null;

    @Column({ name: 'records_processed', type: 'int', default: 0 })
    recordsProcessed?: number;

    @Column({ name: 'records_updated', type: 'int', default: 0 })
    recordsUpdated?: number;
}

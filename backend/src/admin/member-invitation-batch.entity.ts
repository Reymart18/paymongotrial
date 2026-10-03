import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'member_invitation_batches' })
export class MemberInvitationBatch {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'varchar', length: 20, default: 'pending' })
    status?: 'pending' | 'processing' | 'completed';

    @Column({ name: 'requested_by', type: 'varchar', length: 120, nullable: true })
    requestedBy?: string | null;

    @Column({ name: 'requested_count', type: 'int', default: 0 })
    requestedCount?: number;

    @Column({ name: 'sent_count', type: 'int', default: 0 })
    sentCount?: number;

    @Column({ name: 'failed_count', type: 'int', default: 0 })
    failedCount?: number;

    @Column({ name: 'started_at', type: 'datetime', nullable: true })
    startedAt?: Date | null;

    @Column({ name: 'completed_at', type: 'datetime', nullable: true })
    completedAt?: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'datetime' })
    createdAt?: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
    updatedAt?: Date;
}

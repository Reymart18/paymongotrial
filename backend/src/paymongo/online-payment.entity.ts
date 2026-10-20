import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export type OnlinePaymentStatus = 'PENDING' | 'UNDER_REVIEW' | 'FAILED' | 'EXPIRED' | 'POSTED';

@Entity({ name: 'online_payments' })
@Index(['accountId'])
@Index(['paymongoCheckoutSessionId'], { unique: true })
export class OnlinePayment {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ length: 64 })
    accountId?: string;

    @Column({ length: 255 })
    memberName?: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount?: number;

    @Column({ type: 'varchar', length: 30, default: 'UNDER_REVIEW' })
    status?: OnlinePaymentStatus;

    @Column({ type: 'varchar', length: 128 })
    paymongoCheckoutSessionId?: string;

    @Column({ type: 'varchar', length: 128, nullable: true })
    paymongoPaymentId?: string | null;

    @Column({ type: 'varchar', length: 128, nullable: true })
    paymongoReference?: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    paymentMethod?: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    billingPeriodLabel?: string | null;

    @Column({ type: 'datetime', nullable: true })
    paidAt?: Date | null;

    @Column({ type: 'boolean', default: false })
    postedToFoxpro?: boolean;

    @Column({ type: 'datetime', nullable: true })
    postedToFoxproAt?: Date | null;

    @Column({ type: 'varchar', length: 50, nullable: true })
    foxproReferenceNumber?: string | null;

    @CreateDateColumn({ type: 'datetime' })
    createdAt?: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updatedAt?: Date;
}

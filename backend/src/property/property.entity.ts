import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { FoxproPayment } from '../foxpro/foxpro-payment.entity';
import { Billing } from '../billing/billing.entity';

@Entity()
export class PropertyAccount {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ unique: true })
    accountId?: string; // e.g., A003005

    @Column()
    neighborhood?: string;

    @Column()
    block?: string;

    @Column()
    lot?: string;

    @Column()
    memberName?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    propertySizeSqm?: number;

    @Column()
    classification?: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    soa?: number;

    @Column({ unique: true })
    username?: string;

    @Column({ type: 'varchar', nullable: true })
    gmail?: string | null;

    @Column({ type: 'varchar', nullable: true })
    telno?: string | null;

    @Column({ type: 'varchar', nullable: true })
    celno?: string | null;

    @Column()
    password?: string;

    @Column({ default: false })
    passwordChanged?: boolean;

    // A property may be included in financial reporting before its owner has
    // provided an email address and been invited to use the portal.
    @Column({ name: 'portal_access_enabled', type: 'boolean', default: true })
    portalAccessEnabled?: boolean;

    @Column({ name: 'invitation_status', type: 'varchar', length: 20, default: 'not_eligible' })
    invitationStatus?: 'not_eligible' | 'pending' | 'processing' | 'sent' | 'failed';

    @Column({ name: 'invitation_attempted_at', type: 'datetime', nullable: true })
    invitationAttemptedAt?: Date | null;

    @Column({ name: 'invitation_sent_at', type: 'datetime', nullable: true })
    invitationSentAt?: Date | null;

    @Column({ name: 'invitation_error', type: 'text', nullable: true })
    invitationError?: string | null;

    @Column({ name: 'invitation_batch_id', type: 'int', nullable: true })
    invitationBatchId?: number | null;

    @Column({ type: 'varchar', length: 32, nullable: true })
    memberAgreementVersion?: string;

    @Column({ type: 'datetime', nullable: true })
    memberAgreementAcceptedAt?: Date;

    @Column({ nullable: true })
    otpHash?: string;

    @Column({ type: 'datetime', nullable: true })
    otpExpiresAt?: Date;

    @Column({ type: 'datetime', nullable: true })
    otpLastSentAt?: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    balance?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    principal?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    interest?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    penalty?: number;


    @OneToMany(() => FoxproPayment, (payment) => payment.account)
    payments?: FoxproPayment[];

    @OneToMany(() => Billing, (billing) => billing.account)
    billings?: Billing[];
}

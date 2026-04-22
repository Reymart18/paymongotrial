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

    @Column()
    password?: string;

    @Column({ default: false })
    passwordChanged?: boolean;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    balance?: number;

    @Column({ default: 'active' })
    status?: string;

    @OneToMany(() => FoxproPayment, (payment) => payment.account)
    payments?: FoxproPayment[];

    @OneToMany(() => Billing, (billing) => billing.account)
    billings?: Billing[];
}
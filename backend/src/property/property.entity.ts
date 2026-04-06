import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Payment } from '../payments/payment.entity';
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

    @Column('int')
    propertySizeSqm?: number;

    @Column()
    classification?: string;

    @Column()
    ownerType?: string;

    @Column({ unique: true })
    username?: string;

    @Column()
    password?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    balance?: number;

    @Column({ default: 'active' })
    status?: string;

    @OneToMany(() => Payment, (payment) => payment.account)
    payments?: Payment[];

    @OneToMany(() => Billing, (billing) => billing.account)
    billings?: Billing[];
}
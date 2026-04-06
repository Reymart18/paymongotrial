import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PropertyAccount } from '../property/property.entity';

@Entity()
export class Payment {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    accountId?: string;

    @ManyToOne(() => PropertyAccount, (account) => account.payments, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'accountId', referencedColumnName: 'accountId' })
    account?: PropertyAccount;

    @Column({ type: 'datetime' })
    paymentDate?: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amountPaid?: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    balanceAfterPayment?: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description?: string;
}

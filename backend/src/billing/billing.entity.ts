import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PropertyAccount } from '../property/property.entity';

@Entity()
export class Billing {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    accountId?: string;

    @ManyToOne(() => PropertyAccount, (account) => account.billings, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'accountId', referencedColumnName: 'accountId' })
    account?: PropertyAccount;

    @Column({ type: 'date' })
    billingDate?: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amountDue?: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description?: string;
}

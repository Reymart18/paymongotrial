import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { PropertyAccount } from '../property/property.entity';

@Entity({ name: 'foxpro_payments' })
@Index(['accountId'])
@Index(['referenceNumber'], { unique: true })
export class FoxproPayment {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ nullable: true })
    accountId?: string | null;

    @ManyToOne(() => PropertyAccount, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'accountId', referencedColumnName: 'accountId' })
    account?: PropertyAccount;

    @Column({ type: 'date' })
    paymentDate?: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    amountPaid?: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    paycat?: string | null;

    @Column({ type: 'varchar', length: 50, nullable: true, default: null })
    referenceNumber?: string | null;

    @CreateDateColumn({ type: 'datetime' })
    created_at?: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updated_at?: Date;
}

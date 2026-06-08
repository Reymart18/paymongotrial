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

@Entity({ name: 'water_billings' })
@Index(['accountId', 'billingPeriod'], { unique: true })
export class WaterBilling {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    accountId?: string;

    @ManyToOne(() => PropertyAccount, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'accountId', referencedColumnName: 'accountId' })
    account?: PropertyAccount;

    @Column({ type: 'varchar', length: 120 })
    billingPeriod?: string;

    @Column({ type: 'date', nullable: true })
    dueDate?: Date | null;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    currentReading?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    previousReading?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    consumption?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    currentCharges?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    previousBalance?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalDue?: number;

    @CreateDateColumn({ type: 'datetime' })
    created_at?: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updated_at?: Date;
}

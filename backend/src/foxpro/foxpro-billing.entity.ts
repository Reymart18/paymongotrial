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

@Entity({ name: 'foxpro_billings' })
@Index(['accountId', 'dueDate'], { unique: true })
export class FoxproBilling {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    accountId?: string;

    @ManyToOne(() => PropertyAccount, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'accountId', referencedColumnName: 'accountId' })
    account?: PropertyAccount;

    @Column({ type: 'date', nullable: true })
    billDate?: Date;

    @Column({ type: 'date', nullable: true })
    dateFrom?: Date;

    @Column({ type: 'date', nullable: true })
    dateTo?: Date;

    @Column({ type: 'date' })
    dueDate?: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    prinBal?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    intBal?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    penBal?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    prinCurr?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    intCurr?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    penCurr?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    duesRate?: number;

    @CreateDateColumn({ type: 'datetime' })
    created_at?: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updated_at?: Date;
}

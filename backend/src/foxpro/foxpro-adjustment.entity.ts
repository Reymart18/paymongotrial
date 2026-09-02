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

@Entity({ name: 'foxpro_adjustments' })
@Index(['accountId'])
@Index(['accountId', 'transDate', 'principal', 'interest', 'memberName', 'penalty'], { unique: true })
export class FoxproAdjustment {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    accountId?: string;

    @ManyToOne(() => PropertyAccount, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'accountId', referencedColumnName: 'accountId' })
    account?: PropertyAccount;

    @Column({ type: 'date' })
    transDate?: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    principal?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    interest?: number;

    @Column({ type: 'varchar', length: 255, default: '' })
    memberName?: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    penalty?: number;

    @CreateDateColumn({ type: 'datetime' })
    created_at?: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updated_at?: Date;
}

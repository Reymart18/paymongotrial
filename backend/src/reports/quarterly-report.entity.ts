import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'quarterly_report_snapshots' })
@Index(['year', 'quarter'], { unique: true })
export class QuarterlyReportSnapshot {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'int' })
    year?: number;

    @Column({ type: 'int' })
    quarter?: number;

    @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
    billedTotal?: number;

    @CreateDateColumn({ type: 'datetime' })
    createdAt?: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updatedAt?: Date;
}

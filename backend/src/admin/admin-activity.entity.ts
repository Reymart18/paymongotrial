import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'admin_activity' })
export class AdminActivity {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'varchar', length: 100 })
    action: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    targetType?: string | null;

    @Column({ type: 'varchar', length: 120, nullable: true })
    targetId?: string | null;

    @Column({ type: 'text', nullable: true })
    details?: string | null;

    @Column({ type: 'int', nullable: true })
    actorId?: number | null;

    @Column({ type: 'varchar', length: 120, nullable: true })
    actorUsername?: string | null;

    @CreateDateColumn()
    createdAt?: Date;
}

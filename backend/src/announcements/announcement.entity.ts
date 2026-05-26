import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'announcements' })
export class Announcement {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ type: 'varchar', length: 255 })
    title?: string;

    @Column({ type: 'text' })
    content?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    image?: string | null;

    @Column({ type: 'varchar', length: 120, nullable: true })
    author?: string | null;

    @Column({ type: 'varchar', length: 20, default: 'all' })
    target?: string;

    @CreateDateColumn({ type: 'datetime' })
    createdAt?: Date;
}

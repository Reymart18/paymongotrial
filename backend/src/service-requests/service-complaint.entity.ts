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

@Entity({ name: 'service_complaints' })
@Index(['accountId', 'createdAt'])
export class ServiceComplaint {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  accountId?: string;

  @ManyToOne(() => PropertyAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId', referencedColumnName: 'accountId' })
  account?: PropertyAccount;

  @Column({ type: 'varchar', length: 80 })
  complaintType?: string;

  @Column({ type: 'varchar', length: 255 })
  subject?: string;

  @Column({ type: 'text' })
  description?: string;

  @Column({ type: 'date' })
  incidentDate?: Date;

  @Column({ type: 'time' })
  incidentTime?: string;

  @Column({ type: 'varchar', length: 255 })
  location?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  evidenceAttachment?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  evidenceOriginalName?: string | null;

  @Column({ type: 'varchar', length: 30, default: 'Under Review' })
  status?: string;

  @Column({ type: 'text', nullable: true })
  adminReply?: string | null;

  @Column({ type: 'datetime', nullable: true })
  adminReplyAt?: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt?: Date;
}

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

@Entity({ name: 'service_requests' })
@Index(['accountId', 'createdAt'])
export class ServiceRequest {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  accountId?: string;

  @ManyToOne(() => PropertyAccount, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId', referencedColumnName: 'accountId' })
  account?: PropertyAccount;

  @Column({ type: 'varchar', length: 80 })
  requestType?: string;

  @Column({ type: 'varchar', length: 255 })
  subject?: string;

  @Column({ type: 'text' })
  description?: string;

  @Column({ type: 'date' })
  preferredDate?: Date;

  @Column({ type: 'varchar', length: 30, default: 'Under Review' })
  status?: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt?: Date;
}

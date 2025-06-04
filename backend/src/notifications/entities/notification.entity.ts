import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ name: 'notification_id' })
  notification_id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  title: string;

  @Column({ type: 'varchar' })
  messages: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'boolean', default: false })
  read: boolean;
}
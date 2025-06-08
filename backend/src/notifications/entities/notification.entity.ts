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

  // Связь с пользователем, который получает уведомление
  @ManyToOne(() => User, (user) => user.notifications, { 
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  user_id: number;
  
  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  message: string;

  // Тип уведомления, например 'friend_request_accepted', 'new_comment'
  @Column({ type: 'varchar', length: 50, nullable: true })
  type: string | null;

  // Ссылка для перехода при клике на уведомление
  @Column({ type: 'varchar', length: 255, nullable: true })
  link: string | null;

  // Прочитано ли уведомление
  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
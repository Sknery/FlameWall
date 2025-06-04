import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamp', name: 'sent_at', default: () => 'CURRENT_TIMESTAMP' })
  sent_at: Date;

  @Column({ type: 'timestamp', name: 'viewed_at', nullable: true, default: null })
  viewed_at: Date | null;

  @Column({ name: 'sender_id' })
  sender_id: number;

  @ManyToOne(() => User, (user) => user.sent_messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ name: 'receiver_id' })
  receiver_id: number;

  @ManyToOne(() => User, (user) => user.received_messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;
}
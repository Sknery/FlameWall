import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FriendStatuses } from '../../common/enums/friend-statuses.enum';

@Entity('friendships')
export class Friendship {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'requester_id' })
  requester_id: number;

  @ManyToOne(() => User, (user) => user.sent_friend_requests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({ name: 'receiver_id' })
  receiver_id: number;

  @ManyToOne(() => User, (user) => user.received_friend_requests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;

  @Column({
    type: 'enum',
    enum: FriendStatuses,
    default: FriendStatuses.PENDING,
  })
  status: FriendStatuses;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
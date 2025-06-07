import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Ranks } from '../../common/enums/ranks.enum';
import { Post } from '../../posts/entities/post.entity';
import { News } from '../../news/entities/news.entity';
import { Friendship } from '../../friendships/entities/friendship.entity';
import { Message } from '../../messages/entities/message.entity';
import { Notification } from '../../notifications/entities/notification.entity';
import { Comment } from '../../comments/entities/comment.entity';
import { Purchase } from '../../purchases/entities/purchase.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Index({ unique: true, where: '"profile_slug" IS NOT NULL' })
  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: true,
    name: 'profile_slug',
  })
  profile_slug: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 36, unique: true, nullable: true })
  minecraft_uuid: string | null;

  @CreateDateColumn({ type: 'timestamp', name: 'first_login', default: () => 'CURRENT_TIMESTAMP' })
  first_login: Date;

  @Column({ type: 'varchar', length: 70, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'pfp_url' })
  pfp_url: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'banner_url' })
  banner_url: string | null;

  @Column({
    type: 'enum',
    enum: Ranks,
    default: Ranks.DEFAULT,
  })
  rank: Ranks;

  @Column({ type: 'boolean', default: false, name: 'is_banned' })
  is_banned: boolean;

  @Column({ type: 'integer', default: 0 })
  balance: number;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  @Exclude({ toPlainOnly: true })
  password_hash: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'timestamp', name: 'email_verified_at', nullable: true, default: null })
  email_verified_at: Date | null;

  @Column({ type: 'timestamp', name: 'last_login', nullable: true })
  last_login: Date | null;

  @Column({ type: 'integer', name: 'reputation_count', default: 0 })
  reputation_count: number;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;
  
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  @Exclude({ toPlainOnly: true })
  deleted_at: Date | null;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => News, (news) => news.author)
  news: News[];

  @OneToMany(() => Friendship, (friendship) => friendship.requester)
  sent_friend_requests: Friendship[];

  @OneToMany(() => Friendship, (friendship) => friendship.receiver)
  received_friend_requests: Friendship[];

  @OneToMany(() => Message, (message) => message.sender)
  sent_messages: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  received_messages: Message[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  @OneToMany(() => Purchase, (purchase) => purchase.user)
  purchases: Purchase[];

  async validatePassword(passwordToValidate: string): Promise<boolean> {
    if (!this.password_hash) return false;
    return bcrypt.compare(passwordToValidate, this.password_hash);
  }
}
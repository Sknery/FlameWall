import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'author_id' })
  author_id: number;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'post_id' })
  post_id: number;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'varchar' })
  content: string;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
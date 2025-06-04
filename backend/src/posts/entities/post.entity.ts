import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Comment } from '../../comments/entities/comment.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'author_id' })
  author_id: number;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'varchar', length: 50 })
  title: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'text' })
  content: string;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];
}
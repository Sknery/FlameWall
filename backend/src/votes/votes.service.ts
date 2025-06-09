import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Vote } from './entities/vote.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';

// --- ИЗМЕНЕНИЕ: Этот тип больше не нужен, мы будем полагаться на выведение типов TypeScript ---
// type VotableEntity = Post | Comment;

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private votesRepository: Repository<Vote>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    private dataSource: DataSource,
  ) {}

  async castVote(
    voterId: number,
    targetType: 'post' | 'comment',
    targetId: number,
    value: number,
  ) {
    return this.dataSource.transaction(async (manager) => {
      // --- ИЗМЕНЕНИЕ: Убираем строгую типизацию, позволяя TypeScript вывести тип как (Post | Comment | null) ---
      let target; 
      
      if (targetType === 'post') {
        target = await manager.findOne(Post, { where: { id: targetId }, relations: ['author'] });
      } else {
        target = await manager.findOne(Comment, { where: { id: targetId }, relations: ['author'] });
      }

      // Эта проверка теперь корректно отсекает случай, когда target === null
      if (!target) {
        throw new NotFoundException(`${targetType} with ID ${targetId} not found.`);
      }

      if (!target.author) {
        throw new NotFoundException(`Author for ${targetType} with ID ${targetId} not found.`);
      }
      if (target.author.id === voterId) {
        throw new ForbiddenException('You cannot vote for your own content.');
      }

      const author = target.author;

      const existingVote = await manager.findOne(Vote, {
        where: {
          voter: { id: voterId },
          [targetType]: { id: targetId },
        },
      });

      let reputationChange = 0;

      if (existingVote) {
        if (existingVote.value === value) {
          await manager.remove(Vote, existingVote);
          reputationChange = -value;
        } else {
          reputationChange = value - existingVote.value;
          existingVote.value = value;
          await manager.save(Vote, existingVote);
        }
      } else {
        const newVote = manager.create(Vote, {
          voter: { id: voterId },
          [targetType]: { id: targetId },
          value,
        });
        await manager.save(Vote, newVote);
        reputationChange = value;
      }

      if (reputationChange !== 0) {
        await manager.increment(User, { id: author.id }, 'reputation_count', reputationChange);
      }
      
      const votes = await manager.find(Vote, { where: { [targetType]: { id: targetId } } });
      const likes = votes.filter(v => v.value === 1).length;
      const dislikes = votes.filter(v => v.value === -1).length;

      return { likes, dislikes };
    });
    
  }
}
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { Vote } from './entities/vote.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import { Comment } from '../comments/entities/comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vote, User, Post, Comment])],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
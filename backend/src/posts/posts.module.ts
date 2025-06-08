import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from './entities/post.entity';
// User больше импортировать не нужно, так как UsersModule глобальный
// Но TypeOrmModule.forFeature([User]) нужен, если мы его здесь используем.
// В нашем PostsService мы используем UserRepository, так что оставляем.
import { User } from '../users/entities/user.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([Post, User])
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
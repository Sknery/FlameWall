import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from '../posts/entities/post.entity';
import { User } from '../users/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Ranks } from '../common/enums/ranks.enum';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createCommentDto: CreateCommentDto, authorId: number, postId: number): Promise<Comment> {
    const author = await this.usersRepository.findOneBy({ id: authorId });
    if (!author) {
      throw new ForbiddenException('User not found or not authorized.');
    }

    const post = await this.postsRepository.findOneBy({ id: postId });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found.`);
    }

    const comment = this.commentsRepository.create({
      ...createCommentDto,
      author: author,
      post: post,
    });

    return this.commentsRepository.save(comment);
  }

  async findAllForPost(postId: number): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { post_id: postId },
      relations: ['author'],
      order: { created_at: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentsRepository.findOneBy({ id });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found.`);
    }
    return comment;
  }

  async update(id: number, updateCommentDto: UpdateCommentDto, userId: number): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({ where: { id }, relations: ['author'] });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found.`);
    }
    
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new ForbiddenException('User performing the action not found.');
    }
    
    const isAuthor = comment.author_id === userId;
    const canManage = [Ranks.ADMIN, Ranks.MODERATOR, Ranks.OWNER].includes(user.rank);

    if (!isAuthor && !canManage) {
      throw new ForbiddenException('You are not authorized to update this comment.');
    }

    Object.assign(comment, updateCommentDto);
    return this.commentsRepository.save(comment);
  }

  async remove(id: number, userId: number): Promise<void> {
    const comment = await this.commentsRepository.findOne({ where: { id }, relations: ['author'] });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found.`);
    }

    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new ForbiddenException('User performing the action not found.');
    }

    const isAuthor = comment.author_id === userId;
    const canManage = [Ranks.ADMIN, Ranks.MODERATOR, Ranks.OWNER].includes(user.rank);

    if (!isAuthor && !canManage) {
      throw new ForbiddenException('You are not authorized to delete this comment.');
    }

    await this.commentsRepository.remove(comment);
  }
}
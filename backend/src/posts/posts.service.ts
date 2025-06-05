import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createPostDto: CreatePostDto, authorId: number): Promise<Post> {
    const author = await this.usersRepository.findOne({ where: { id: authorId } });
    if (!author) {
      throw new ForbiddenException('User not found or not authorized to create a post.');
    }

    const post = this.postsRepository.create({
      ...createPostDto, // title, content
      author: author,   // Связываем пост с автором
    });

    return this.postsRepository.save(post);
  }

  async findAll(): Promise<Post[]> {
    return this.postsRepository.find({
      relations: ['author'], // Загружаем информацию об авторе
      order: {
        created_at: 'DESC', // Сортируем посты: сначала новые
      },
    });
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author'], // Загружаем информацию об авторе
      // Позже сюда можно будет добавить 'comments', 'comments.author'
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found.`);
    }
    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto, userId: number): Promise<Post> {
    const post = await this.findOne(id); // findOne уже содержит проверку на NotFoundException и загружает автора

    if (post.author_id !== userId) {
      // Здесь можно добавить проверку на роль администратора/модератора, если они могут редактировать чужие посты
      // const user = await this.usersRepository.findOne({ where: { id: userId } });
      // if (user.rank !== Ranks.ADMIN && user.rank !== Ranks.MODERATOR) { // Потребуется импорт Ranks
      //   throw new ForbiddenException('You are not authorized to update this post.');
      // }
      throw new ForbiddenException('You are not authorized to update this post.');
    }

    Object.assign(post, updatePostDto);
    return this.postsRepository.save(post);
  }

  async remove(id: number, userId: number): Promise<void> {
    const post = await this.findOne(id); // findOne уже содержит проверку на NotFoundException

    if (post.author_id !== userId) {
      // Аналогично, здесь может быть проверка на роль администратора/модератора
      throw new ForbiddenException('You are not authorized to delete this post.');
    }

    await this.postsRepository.remove(post);
  }
}
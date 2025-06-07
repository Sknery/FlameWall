import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    @InjectRepository(User) 
    private usersRepository: Repository<User>,
  ) {}

  async create(createNewsDto: CreateNewsDto, authorId: number): Promise<News> {
    const author = await this.usersRepository.findOne({ where: { id: authorId } });
    if (!author) {
      throw new ForbiddenException('Authenticated user not found.');
    }

    const newsItem = this.newsRepository.create({
      ...createNewsDto, 
      author: author,   
    });

    return this.newsRepository.save(newsItem);
  }

  async findAll(): Promise<News[]> {
    return this.newsRepository.find({ 
      relations: ['author'],
      order: {
        created_at: 'DESC',
      }
    });
  }

  async findOne(id: number): Promise<News> {
    const newsItem = await this.newsRepository.findOne({ 
      where: { id },
      relations: ['author'] 
    });
    if (!newsItem) {
      throw new NotFoundException(`News item with ID ${id} not found`);
    }
    return newsItem;
  }
}
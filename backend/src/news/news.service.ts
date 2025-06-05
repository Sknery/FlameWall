import { Injectable, NotFoundException } from '@nestjs/common';
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

  async create(createNewsDto: CreateNewsDto, userId?: number): Promise<News> {
    const newsItem = this.newsRepository.create(createNewsDto);
    if (userId) {
        const author = await this.usersRepository.findOne({ where: { id: userId } });
        if (!author) throw new NotFoundException(`Author with ID ${userId} not found`);
        newsItem.author = author;
    } else if (createNewsDto.author_id) {
        const author = await this.usersRepository.findOne({ where: { id: createNewsDto.author_id } });
        if (!author) throw new NotFoundException(`Author with ID ${createNewsDto.author_id} not found`);
        newsItem.author = author;
    }
    return this.newsRepository.save(newsItem);
  }

  async findAll(): Promise<News[]> {
    return this.newsRepository.find({ relations: ['author'] });
  }

  async findOne(id: number): Promise<News> {
    const newsItem = await this.newsRepository.findOne({ where: { id }, relations: ['author'] });
    if (!newsItem) {
      throw new NotFoundException(`News item with ID ${id} not found`);
    }
    return newsItem;
  }
}
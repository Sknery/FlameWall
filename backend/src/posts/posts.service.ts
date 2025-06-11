import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { User } from '../users/entities/user.entity';
import { Ranks } from '../common/enums/ranks.enum';
import { FindAllPostsDto } from './dto/find-all-posts';

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
      ...createPostDto,
      author: author,
    });

    return this.postsRepository.save(post);
  }

async findAll(queryDto: FindAllPostsDto): Promise<any[]> {
    const { sortBy, order, search } = queryDto;

    const queryBuilder = this.postsRepository.createQueryBuilder('post');

    queryBuilder
      .leftJoinAndSelect('post.author', 'author')
      // Добавляем вычисляемое поле 'score' (сумма значений из таблицы votes)
      .addSelect('COALESCE(SUM(votes.value), 0)', 'score')
      .leftJoin('post.votes', 'votes')
      .groupBy('post.id, author.id');

    if (search) {
      queryBuilder.where('post.title ILIKE :search', { search: `%${search}%` });
    }

    // Безопасная сортировка
    if (sortBy === 'score') {
      queryBuilder.orderBy('score', order);
    } else {
      queryBuilder.orderBy('post.created_at', order);
    }

    const posts = await queryBuilder.getRawAndEntities();

    // getRawAndEntities возвращает сложный объект, нам нужно его обработать
    return posts.entities.map((post, index) => {
      return {
        ...post,
        score: parseInt(posts.raw[index].score, 10),
      };
    });
  }

  async findOne(id: number, userId?: number): Promise<any> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: [
        'author', 
        'comments', 
        'comments.author',
        'votes',
        'comments.votes',
        'votes.voter', // Загружаем voter, чтобы получить voter.id
        'comments.votes.voter',
      ],
      order: {
        comments: { created_at: "ASC" },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found.`);
    }

    // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
    const mapVotes = (entity: any, currentUserId?: number) => {
      const likes = entity.votes.filter(v => v.value === 1).length;
      const dislikes = entity.votes.filter(v => v.value === -1).length;
      
      let currentUserVote = 0;
      if (currentUserId) {
        const vote = entity.votes.find(v => v.voter.id === currentUserId);
        if(vote) currentUserVote = vote.value;
      }
      
      // Создаем новый объект, исключая из него полное свойство votes
      const { votes, ...restOfEntity } = entity;

      return { ...restOfEntity, likes, dislikes, currentUserVote };
    };

    const postWithVotes = mapVotes(post, userId);

    if (post.comments) {
        postWithVotes.comments = post.comments.map(comment => mapVotes(comment, userId));
    }
    
    return postWithVotes;
  }

  async update(id: number, updatePostDto: UpdatePostDto, userId: number): Promise<Post> {
    const post = await this.findOne(id);
    const user = await this.usersRepository.findOne({ where: { id: userId }});

    if (!user) {
      throw new ForbiddenException('User performing the action not found.');
    }

    const isAuthor = post.author_id === userId;
    const canManagePosts = [Ranks.ADMIN, Ranks.MODERATOR, Ranks.OWNER].includes(user.rank);

    if (!isAuthor && !canManagePosts) {
      throw new ForbiddenException('You are not authorized to update this post.');
    }

    Object.assign(post, updatePostDto);
    return this.postsRepository.save(post);
  }

  async remove(id: number, userId: number): Promise<void> {
    const post = await this.findOne(id);
    const user = await this.usersRepository.findOne({ where: { id: userId }});

    if (!user) {
      throw new ForbiddenException('User performing the action not found.');
    }

    const isAuthor = post.author_id === userId;
    const canManagePosts = [Ranks.ADMIN, Ranks.MODERATOR, Ranks.OWNER].includes(user.rank);

    if (!isAuthor && !canManagePosts) {
      throw new ForbiddenException('You are not authorized to delete this post.');
    }

    await this.postsRepository.remove(post);
  }
}
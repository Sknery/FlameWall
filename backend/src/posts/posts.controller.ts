import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Injectable,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Post as PostEntity } from './entities/post.entity';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger'; // Импортируем декораторы Swagger
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { FindAllPostsDto } from './dto/find-all-posts';

@ApiTags('Posts') 
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() 
  @ApiOperation({ summary: 'Create a new post' }) 
  @ApiResponse({ status: 201, description: 'The post has been successfully created.', type: PostEntity })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User not found or not authorized.' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createPostDto: CreatePostDto, @Request() req): Promise<PostEntity> {
    const authorId = req.user.userId;
    return this.postsService.create(createPostDto, authorId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({ status: 200, description: 'Return all posts.', type: [PostEntity] })
  // --- ИЗМЕНЕНО: Принимаем query-параметры ---
  findAll(@Query(new ValidationPipe({ transform: true, forbidNonWhitelisted: true })) query: FindAllPostsDto): Promise<PostEntity[]> {
    return this.postsService.findAll(query);
  }

 @Get(':id')
  @UseGuards(OptionalJwtAuthGuard) // Используем "мягкий" Guard
  @ApiOperation({ summary: 'Get a specific post by ID' })
  @ApiResponse({ status: 200, description: 'Return the post.', type: PostEntity })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<PostEntity> {
    // req.user может быть объектом пользователя или undefined
    const userId = req.user ? req.user.userId : null;
    return this.postsService.findOne(id, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() 
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: 200, description: 'The post has been successfully updated.', type: PostEntity })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User not authorized to update this post.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  @UsePipes(new ValidationPipe({ whitelist: true, skipMissingProperties: true, forbidNonWhitelisted: true }))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req,
  ): Promise<PostEntity> {
    const userId = req.user.userId;
    return this.postsService.update(id, updatePostDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() 
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 200, description: 'The post has been successfully deleted.' }) 
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User not authorized to delete this post.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<void> {
    const userId = req.user.userId;
    return this.postsService.remove(id, userId);
  }
}
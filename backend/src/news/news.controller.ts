import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  ParseIntPipe, 
  UsePipes, 
  ValidationPipe, 
  UseGuards, 
  Request 
} from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Ranks } from '../common/enums/ranks.enum';
import { News as NewsEntity } from './entities/news.entity'; 
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('News') 
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Ranks.ADMIN, Ranks.MODERATOR, Ranks.OWNER)
  @ApiBearerAuth() 
  @ApiOperation({ summary: 'Create a new news article (Admins/Mods only)' })
  @ApiResponse({ status: 201, description: 'The news article has been successfully created.', type: NewsEntity })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid input data.'})
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. User does not have permission or not found.' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createNewsDto: CreateNewsDto, @Request() req): Promise<NewsEntity> {
    return this.newsService.create(createNewsDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all news articles' })
  @ApiResponse({ status: 200, description: 'Return all news articles.', type: [NewsEntity] })
  findAll(): Promise<NewsEntity[]> {
    return this.newsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific news article by ID' })
  @ApiResponse({ status: 200, description: 'Return the news article.', type: NewsEntity })
  @ApiResponse({ status: 404, description: 'News article not found.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<NewsEntity> {
    return this.newsService.findOne(id);
  }
}
import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Votes & Reputation')
@Controller('votes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post('/posts/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vote for a post' })
  voteForPost(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() createVoteDto: CreateVoteDto,
  ) {
    const voterId = req.user.userId;
    return this.votesService.castVote(voterId, 'post', id, createVoteDto.value);
  }

  @Post('/comments/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vote for a comment' })
  voteForComment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Body() createVoteDto: CreateVoteDto,
  ) {
    const voterId = req.user.userId;
    return this.votesService.castVote(voterId, 'comment', id, createVoteDto.value);
  }
}
import { Controller, Get, Param, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversation/:otherUserId')
  @ApiOperation({ summary: 'Get conversation history with another user' })
  getConversation(
    @Request() req,
    @Param('otherUserId', ParseIntPipe) otherUserId: number
  ) {
    const currentUserId = req.user.userId;
    return this.messagesService.getConversation(currentUserId, otherUserId);
  }
}
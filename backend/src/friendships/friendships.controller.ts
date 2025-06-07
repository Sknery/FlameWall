import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, ParseIntPipe, Patch } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Friendships')
@Controller('friendships')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Post('requests')
  @ApiOperation({ summary: 'Send a friend request' })
  sendRequest(@Body() createDto: CreateFriendRequestDto, @Request() req) {
    return this.friendshipsService.sendRequest(req.user.userId, createDto.receiverId);
  }

  @Get('requests/pending')
  @ApiOperation({ summary: 'Get my pending incoming friend requests' })
  getPendingRequests(@Request() req) {
    return this.friendshipsService.getPendingRequests(req.user.userId);
  }

  @Patch('requests/:id/accept')
  @ApiOperation({ summary: 'Accept a friend request' })
  acceptRequest(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.friendshipsService.acceptRequest(id, req.user.userId);
  }

  @Delete('requests/:id')
  @ApiOperation({ summary: 'Reject an incoming request or cancel an outgoing request' })
  rejectOrCancelRequest(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.friendshipsService.rejectOrCancelRequest(id, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get my friends list' })
  listFriends(@Request() req) {
    return this.friendshipsService.listFriends(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a friend' })
  removeFriend(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.friendshipsService.removeFriend(id, req.user.userId);
  }
}
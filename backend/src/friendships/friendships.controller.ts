import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, ParseIntPipe, Patch } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

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
  @ApiOperation({ summary: 'Remove a friend by friendship ID' })
  removeFriend(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.friendshipsService.removeFriend(id, req.user.userId);
  }

  // НОВЫЙ ЭНДПОИНТ
  @Get('status/:otherUserId')
  @ApiOperation({ summary: 'Check friendship status with another user' })
  getFriendshipStatus(@Param('otherUserId', ParseIntPipe) otherUserId: number, @Request() req) {
    return this.friendshipsService.getFriendshipStatus(req.user.userId, otherUserId);
  }

  // НОВЫЙ ЭНДПОИНТ
  @Post('block/:userToBlockId')
  @ApiOperation({ summary: 'Block a user' })
  blockUser(@Param('userToBlockId', ParseIntPipe) userToBlockId: number, @Request() req) {
    return this.friendshipsService.blockUser(req.user.userId, userToBlockId);
  }

  // НОВЫЙ ЭНДПОИНТ
  @Delete('block/:userToUnblockId')
  @ApiOperation({ summary: 'Unblock a user' })
  unblockUser(@Param('userToUnblockId', ParseIntPipe) userToUnblockId: number, @Request() req) {
    return this.friendshipsService.unblockUser(req.user.userId, userToUnblockId);
  }
}
import { Controller, Post, Body, UseGuards, Delete, Get, Param, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { FriendshipsService } from './friendships.service';
import { PluginApiKeyGuard } from '../auth/guards/plugin-api-key.guard';
import { FromPluginAddFriendDto } from './dto/from-plugin-add-friend.dto';
import { FromPluginRemoveFriendDto } from './dto/from-plugin-remove-friend.dto';

@ApiTags('Plugin Bridge')
@Controller('api/friendships/from-plugin')
@UseGuards(PluginApiKeyGuard)
@ApiHeader({
  name: 'x-api-key',
  description: 'The secret API key for the Minecraft plugin',
  required: true,
})
export class FriendshipsPluginController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Post('add')
  addFriendFromPlugin(@Body(new ValidationPipe()) dto: FromPluginAddFriendDto) {
    return this.friendshipsService.sendRequestFromPlugin(dto.requesterUuid, dto.receiverName);
  }

  @Delete('remove')
  removeFriendFromPlugin(@Body(new ValidationPipe()) dto: FromPluginRemoveFriendDto) {
    return this.friendshipsService.removeFriendFromPlugin(dto.removerUuid, dto.friendToRemoveName);
  }

  @Get('list/:uuid')
  listFriendsForPlugin(@Param('uuid') uuid: string): Promise<string[]> {
    return this.friendshipsService.listFriendsForPlugin(uuid);
  }
}
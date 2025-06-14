import { Module } from '@nestjs/common';
import { FriendshipsService } from './friendships.service';
import { FriendshipsController } from './friendships.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from './entities/friendship.entity';
import { User } from '../users/entities/user.entity';
import { FriendshipsPluginController } from './friendships.plugin.controller'; // <-- ДОБАВЛЕНО
import { PluginApiKeyGuard } from '../auth/guards/plugin-api-key.guard'; // <-- ДОБАВЛЕНО

@Module({
  imports: [TypeOrmModule.forFeature([Friendship, User])],
  controllers: [FriendshipsController, FriendshipsPluginController], // <-- ДОБАВЛЕНО
  providers: [FriendshipsService, PluginApiKeyGuard], // <-- ДОБАВЛЕНО
  exports: [FriendshipsService],
})
export class FriendshipsModule {}
// backend/src/chat/chat.module.ts

import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { WsGuard } from 'src/auth/guards/ws.guard';
import { FriendshipsModule } from 'src/friendships/friendships.module';
import { LinkingModule } from 'src/linking/linking.module'; // <-- ДОБАВЛЯЕМ ИМПОРТ

@Module({
  imports: [
    MessagesModule,
    AuthModule,
    UsersModule,
    FriendshipsModule,
    LinkingModule, // <-- ДОБАВЯЕМ НАШ НОВЫЙ МОДУЛЬ СЮДА
  ],
  providers: [ChatGateway, WsGuard],
})
export class ChatModule {}
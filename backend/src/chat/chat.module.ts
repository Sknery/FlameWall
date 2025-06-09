import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { WsGuard } from 'src/auth/guards/ws.guard';
// --- ДОБАВЛЕНО: Импортируем модуль дружбы ---
import { FriendshipsModule } from 'src/friendships/friendships.module';

@Module({
  // --- ИЗМЕНЕНО: Добавляем FriendshipsModule в импорты ---
  imports: [MessagesModule, AuthModule, UsersModule, FriendshipsModule],
  // Провайдеры остаются без изменений, ConfigService удален, так как он не используется
  providers: [ChatGateway, WsGuard],
})
export class ChatModule {}
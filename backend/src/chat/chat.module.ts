import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
import { WsGuard } from 'src/auth/guards/ws.guard';
import { ConfigService } from '@nestjs/config';
// WsGuard и ConfigService больше не нужны здесь напрямую

@Module({
  imports: [MessagesModule, AuthModule, UsersModule],
  providers: [ChatGateway, WsGuard, ConfigService],
})
export class ChatModule {}
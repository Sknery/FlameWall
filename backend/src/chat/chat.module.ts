import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { MessagesModule } from '../messages/messages.module';
// WsGuard и ConfigService больше не нужны здесь напрямую

@Module({
  imports: [MessagesModule], // Глобальные модули UsersModule и AuthModule подтянутся автоматически
  providers: [ChatGateway],
})
export class ChatModule {}
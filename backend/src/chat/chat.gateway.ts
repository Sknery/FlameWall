import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,

} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { WsGuard } from '../auth/guards/ws.guard';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { processedSockets } from './connection-lock'; // <-- Импортируем наш замок

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');
  private onlineUsers = new Map<number, string>();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  async handleConnection(client: Socket) {

    
    if (processedSockets.has(client.id)) {
      this.logger.warn(`Duplicate connection event for SID: ${client.id}. Ignoring.`);
      return;
    }
    processedSockets.add(client.id);
    // Получаем токен из специального поля 'auth', а не из заголовков
    const token = client.handshake.auth.token;

    if (!token) {
      this.logger.error(`Connection Refused: Token not found in handshake auth. SID: ${client.id}`);
      return client.disconnect();
    }

    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findUserEntityById(payload.sub);

      if (!user || user.is_banned) {
        this.logger.error(`Connection Refused: User #${payload.sub} not found or banned.`);
        return client.disconnect();
      }

      client['user'] = user; // Прикрепляем пользователя к сокету
      this.onlineUsers.set(user.id, client.id);
      this.logger.log(`Client Authenticated & Connected: ${client.id}, User ID: ${user.id}`);

    } catch (e) {
      this.logger.error(`Authentication failed: ${e.message}. Disconnecting SID: ${client.id}`);
      return client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    processedSockets.delete(client.id);

    const user: User = client['user'];
    if (user && this.onlineUsers.get(user.id) === client.id) {
      this.onlineUsers.delete(user.id);
      this.logger.log(`Client disconnected: User ID ${user.id}`);
    }
  }

  @UseGuards(WsGuard) // Гвард теперь просто проверяет, есть ли client['user']
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { recipientId: number; content: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const sender: User = client['user'];

    const recipient = await this.usersService.findUserEntityById(data.recipientId);
    if (!recipient) return;

    const savedMessage = await this.messagesService.createMessage(sender, recipient, data.content);
    if (!savedMessage) return;

    const recipientSocketId = this.onlineUsers.get(data.recipientId);

    this.server.to(client.id).emit('newMessage', savedMessage);
    if (recipientSocketId && recipientSocketId !== client.id) {
      this.server.to(recipientSocketId).emit('newMessage', savedMessage);
    }
  }
}
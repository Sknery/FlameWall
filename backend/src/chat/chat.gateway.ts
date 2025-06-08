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
import { Logger } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

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
  ) {}
  
  // Теперь вся логика аутентификации здесь
  async handleConnection(client: Socket) {
    // Получаем токен из специального поля 'auth'
    const token = client.handshake.auth.token;

    if (!token) {
      this.logger.error(`Connection Refused: Token not found in auth object. SID: ${client.id}`);
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
    const user: User = client['user'];
    if (user && this.onlineUsers.get(user.id) === client.id) {
        this.onlineUsers.delete(user.id);
        this.logger.log(`Client disconnected: User ID ${user.id}`);
    }
  }

  // Для этого метода больше не нужен гвард, так как мы проверяем 'user' вручную
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { recipientId: number; content: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const sender: User = client['user'];
    // Если по какой-то причине пользователь не прикреплен, игнорируем сообщение
    if (!sender) {
      this.logger.warn(`Unauthenticated user with SID ${client.id} tried to send a message.`);
      return;
    }
    
    const recipient = await this.usersService.findUserEntityById(data.recipientId);
    if (!recipient) return;
    
    const savedMessage = await this.messagesService.createMessage(sender, recipient, data.content);
    if (!savedMessage) return; // Защита от дублей

    const recipientSocketId = this.onlineUsers.get(data.recipientId);

    // Отправляем сообщение себе и получателю
    this.server.to(client.id).emit('newMessage', savedMessage);
    if (recipientSocketId && recipientSocketId !== client.id) {
      this.server.to(recipientSocketId).emit('newMessage', savedMessage);
    }
  }
}
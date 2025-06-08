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
import { Logger,  UseGuards, } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { WsGuard } from '../auth/guards/ws.guard';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');

  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}
  
  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    if (!token) return client.disconnect();

    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findUserEntityById(payload.sub);
      if (!user || user.is_banned) return client.disconnect();
      
      client['user'] = user;
      // Заставляем сокет войти в его личную комнату
      client.join(`user-${user.id}`);
      this.logger.log(`Client Authenticated & Connected: SID ${client.id}, User ID ${user.id}, Joined room user-${user.id}`);

    } catch (e) {
      return client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user: User = client['user'];
    if (user) {
        this.logger.log(`Client disconnected: User ID ${user.id}`);
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { recipientId: number; content: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const sender: User = client['user'];
    if (!sender) return;
    
    const recipient = await this.usersService.findUserEntityById(data.recipientId);
    if (!recipient) return;
    
    const savedMessage = await this.messagesService.createMessage(sender, recipient, data.content);
    if (!savedMessage) return;

    const recipientRoom = `user-${data.recipientId}`;

    // Отправляем сообщение в личную комнату получателя
    this.server.to(recipientRoom).emit('newMessage', savedMessage);
    
    // И отправляем копию сообщения себе (в свою комнату), чтобы UI обновился
    // Проверяем, что не отправляем сообщение самому себе дважды
    if (sender.id !== data.recipientId) {
        this.server.to(`user-${sender.id}`).emit('newMessage', savedMessage);
    }
  }
}
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
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { Notification } from '../notifications/entities/notification.entity';

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
    private eventEmitter: EventEmitter2, // <-- ВНЕДРЯЕМ EVENT EMITTER
  ) {}
  
  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    if (!token) return client.disconnect();

    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findUserEntityById(payload.sub);
      if (!user || user.is_banned) return client.disconnect();
      
      client['user'] = user;
      client.join(`user-${user.id}`);
      this.onlineUsers.set(user.id, client.id); // Добавляем пользователя в онлайн-карту
      this.logger.log(`Client Authenticated & Connected: SID ${client.id}, User ID ${user.id}, Joined room user-${user.id}`);

    } catch (e) {
      return client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user: User = client['user'];
    if (user && this.onlineUsers.get(user.id) === client.id) {
        this.onlineUsers.delete(user.id); // Удаляем пользователя из онлайн-карты
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

    // "КРИЧИМ" О СОБЫТИИ, ЧТО БЫЛО ОТПРАВЛЕНО НОВОЕ СООБЩЕНИЕ
    this.eventEmitter.emit('message.sent', { sender, recipient });

    const recipientRoom = `user-${data.recipientId}`;

    this.server.to(recipientRoom).emit('newMessage', savedMessage);
    
    if (sender.id !== data.recipientId) {
        this.server.to(`user-${sender.id}`).emit('newMessage', savedMessage);
    }
  }

  // Этот метод мы уже добавили ранее, он слушает создание уведомлений
  @OnEvent('notification.created')
  handleNotificationCreated(payload: Notification) {
    if (payload.user && payload.user.id) {
      const room = `user-${payload.user.id}`;
      this.logger.log(`Sending new notification (ID: ${payload.notification_id}) to room ${room}`);
      this.server.to(room).emit('newNotification', payload);
    }
  }
}
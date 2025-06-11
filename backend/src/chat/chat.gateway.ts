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
import { Logger, UseGuards, ValidationPipe } from '@nestjs/common';
import { MessagesService } from '../messages/messages.service';
import { WsGuard } from '../auth/guards/ws.guard';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Notification } from '../notifications/entities/notification.entity';
import { FriendshipsService } from 'src/friendships/friendships.service';
import { CreateMessageDto } from 'src/messages/dto/create-message.dto';


@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');
  private onlineUsers = new Map<number, string>();
  // --- ДОБАВЛЕНО: Хранилище для отслеживания, кто какой чат смотрит ---
  //   Ключ: ID пользователя, который смотрит чат.
  //   Значение: ID пользователя, с которым открыт чат.
  private currentlyViewing = new Map<number, number>();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
        private readonly friendshipsService: FriendshipsService,

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
      this.onlineUsers.set(user.id, client.id);
      this.logger.log(`Client Authenticated & Connected: SID ${client.id}, User ID ${user.id}, Joined room user-${user.id}`);

    } catch (e) {
      return client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user: User = client['user'];
    if (user) {
      if (this.onlineUsers.get(user.id) === client.id) {
          this.onlineUsers.delete(user.id);
          this.logger.log(`Client disconnected: User ID ${user.id}`);
      }
      // --- ДОБАВЛЕНО: Убираем пользователя из списка смотрящих при дисконнекте ---
      this.currentlyViewing.delete(user.id);
    }
  }

   @UseGuards(WsGuard)
  @SubscribeMessage('sendMessage')
  // --- ИЗМЕНЕНО: Применяем DTO и ValidationPipe к данным ---
  async handleMessage(
    @MessageBody(new ValidationPipe()) data: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const sender: User = client['user'];
    if (!sender) return;
    
    const recipient = await this.usersService.findUserEntityById(data.recipientId);
    if (!recipient) return;
    
    const areFriends = await this.friendshipsService.areTheyFriends(sender.id, recipient.id);
    if (!areFriends) {
      this.logger.warn(`BLOCKED: User ${sender.id} attempted to message non-friend ${recipient.id}.`);
      return;
    }

    const savedMessage = await this.messagesService.createMessage(sender, recipient, data.content);
    if (!savedMessage) return;

    const recipientIsViewing = this.currentlyViewing.get(recipient.id) === sender.id;

    if (recipientIsViewing) {
      this.logger.log(`Recipient ${recipient.id} is viewing chat with ${sender.id}. Notification suppressed.`);
    } else {
      this.eventEmitter.emit('message.sent', { sender, recipient });
    }

    const recipientRoom = `user-${data.recipientId}`;
    this.server.to(recipientRoom).emit('newMessage', savedMessage);
    
    if (sender.id !== data.recipientId) {
        this.server.to(`user-${sender.id}`).emit('newMessage', savedMessage);
    }
  }

  // --- НОВЫЙ МЕТОД: Пользователь начал просмотр чата ---
  @UseGuards(WsGuard)
  @SubscribeMessage('startViewingChat')
  handleStartViewingChat(
    @MessageBody() data: { otherUserId: number },
    @ConnectedSocket() client: Socket,
  ): void {
      const currentUser: User = client['user'];
      if (currentUser && data.otherUserId) {
        this.currentlyViewing.set(currentUser.id, data.otherUserId);
        this.logger.log(`User ${currentUser.id} started viewing chat with ${data.otherUserId}`);
      }
  }

  // --- НОВЫЙ МЕТОД: Пользователь закончил просмотр чата ---
  @UseGuards(WsGuard)
  @SubscribeMessage('stopViewingChat')
  handleStopViewingChat(@ConnectedSocket() client: Socket): void {
      const currentUser: User = client['user'];
      if (currentUser && this.currentlyViewing.has(currentUser.id)) {
        this.currentlyViewing.delete(currentUser.id);
        this.logger.log(`User ${currentUser.id} stopped viewing chat.`);
      }
  }

  @OnEvent('notification.created')
  handleNotificationCreated(payload: Notification) {
    if (payload && payload.user && payload.user.id) {
      const room = `user-${payload.user.id}`;
      this.logger.log(`Event 'notification.created' caught. Emitting 'newNotification' to room ${room}`);
      this.server.to(room).emit('newNotification', payload);
    } else {
        this.logger.warn('Caught notification.created event with invalid payload', payload);
    }
  }
}
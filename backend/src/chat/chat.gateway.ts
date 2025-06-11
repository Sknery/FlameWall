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
// --- НОВЫЕ ИМПОРТЫ ---
import { EditMessageDto } from 'src/messages/dto/edit-message.dto';
import { DeleteMessageDto } from 'src/messages/dto/delete-message.dto';
import { LinkingService } from 'src/linking/linking.service'; // <-- НОВЫЙ ИМПОРТ
import { ConfigService } from '@nestjs/config'; // <-- Добавляем импорт ConfigService


// DTO для данных от плагина
class LinkAccountDto {
  code: string;
  minecraftUuid: string;
  minecraftUsername: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');
  private onlineUsers = new Map<number, string>();
  private currentlyViewing = new Map<number, number>();
  private readonly pluginSecretKey: string; // <-- Поле для хранения ключа

  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly friendshipsService: FriendshipsService,
    private readonly linkingService: LinkingService,
    private readonly configService: ConfigService,
  ) {
    // --- ИСПРАВЛЕННАЯ ЛОГИКА ---
    const key = this.configService.get<string>('PLUGIN_SECRET_KEY');
    if (!key) {
      // Если ключ не найден, выбрасываем ошибку и не даем серверу запуститься
      throw new Error('PLUGIN_SECRET_KEY is not defined in .env file!');
    }
    // Если мы дошли до сюда, TypeScript уверен, что 'key' - это строка
    this.pluginSecretKey = key;
  }

  async handleConnection(client: Socket) {
    this.logger.debug(`New connection headers: ${JSON.stringify(client.handshake.headers)}`);

    const apiKey = client.handshake.headers['x-api-key'];

    // --- НОВАЯ ЛОГИКА: Сначала проверяем, не плагин ли это ---
    if (apiKey && apiKey === this.pluginSecretKey) {
      this.logger.log('Minecraft Plugin connected successfully!');
      client['isPlugin'] = true; // Помечаем сокет как принадлежащий плагину
      return; // Завершаем обработку, аутентификация пройдена
    }

    
    // --- Старая логика для обычных пользователей ---
    const token = client.handshake.auth.token;
    if (!token) return client.disconnect();
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findUserEntityById(payload.sub);
      if (!user || user.is_banned) return client.disconnect();

      client['user'] = user;
      client.join(`user-${user.id}`);
      this.onlineUsers.set(user.id, client.id);
      this.logger.log(`Client Authenticated & Connected: SID ${client.id}, User ID ${user.id}`);
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
      this.currentlyViewing.delete(user.id);
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    // --- ИЗМЕНЕНО: Добавляем parentMessageId для ответов ---
    @MessageBody(new ValidationPipe()) data: CreateMessageDto & { parentMessageId?: number },
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

    // --- ИЗМЕНЕНО: Передаем parentMessageId в сервис ---
    const savedMessage = await this.messagesService.createMessage(sender, recipient, data.content, data.parentMessageId);
    if (!savedMessage) return;

    const recipientIsViewing = this.currentlyViewing.get(recipient.id) === sender.id;

    if (recipientIsViewing) {
      this.logger.log(`Recipient ${recipient.id} is viewing chat with ${sender.id}. Notification suppressed.`);
    } else if (sender.id !== recipient.id) { // Не отправляем уведомление о сообщении самому себе
      this.eventEmitter.emit('message.sent', { sender, recipient });
    }

    // Отправляем новое сообщение обоим участникам диалога
    this.server.to(`user-${recipient.id}`).emit('newMessage', savedMessage);
    if (sender.id !== recipient.id) {
      this.server.to(`user-${sender.id}`).emit('newMessage', savedMessage);
    }
  }

  // --- НОВЫЙ ОБРАБОТЧИК: Редактирование сообщения ---
  @UseGuards(WsGuard)
  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @MessageBody(new ValidationPipe()) data: EditMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const sender: User = client['user'];
    try {
      const updatedMessage = await this.messagesService.updateMessage(sender.id, data.messageId, data.content);

      this.server.to(`user-${updatedMessage.sender_id}`).emit('messageEdited', updatedMessage);
      this.server.to(`user-${updatedMessage.receiver_id}`).emit('messageEdited', updatedMessage);
    } catch (error) {
      this.logger.error(`Failed to edit message for user ${sender.id}: ${error.message}`);
      client.emit('error', { message: 'Failed to edit message.' });
    }
  }

  // --- НОВЫЙ ОБРАБОТЧИК: Удаление сообщения ---
  @UseGuards(WsGuard)
  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @MessageBody(new ValidationPipe()) data: DeleteMessageDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const sender: User = client['user'];
    try {
      const deletedMessage = await this.messagesService.deleteMessage(sender.id, data.messageId);

      const payload = { messageId: deletedMessage.id };
      this.server.to(`user-${deletedMessage.sender_id}`).emit('messageDeleted', payload);
      this.server.to(`user-${deletedMessage.receiver_id}`).emit('messageDeleted', payload);
    } catch (error) {
      this.logger.error(`Failed to delete message for user ${sender.id}: ${error.message}`);
      client.emit('error', { message: 'Failed to delete message.' });
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('startViewingChat')
  handleStartViewingChat(@MessageBody() data: { otherUserId: number }, @ConnectedSocket() client: Socket): void {
    const currentUser: User = client['user'];
    if (currentUser && data.otherUserId) {
      this.currentlyViewing.set(currentUser.id, data.otherUserId);
      this.logger.log(`User ${currentUser.id} started viewing chat with ${data.otherUserId}`);
    }
  }

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

  @SubscribeMessage('linkAccount')
  async handleLinkAccount(@MessageBody() data: LinkAccountDto, @ConnectedSocket() client: Socket): Promise<void> {
    this.logger.log(`Received link attempt for code ${data.code}`);
    try {
      const linkedUser = await this.linkingService.verifyCodeAndLinkAccount(
        data.code,
        data.minecraftUuid,
        data.minecraftUsername,
      );

      // --- ИЗМЕНЕНИЕ ЗДЕСЬ: Отправляем больше данных обратно плагину ---
      client.emit('linkStatus', {
        success: true,
        minecraftUuid: linkedUser.minecraft_uuid,
        websiteUsername: linkedUser.username
      });

      this.server.to(`user-${linkedUser.id}`).emit('linkStatus', { success: true, minecraftUsername: linkedUser.minecraft_username });

    } catch (error) {
      // --- ИЗМЕНЕНИЕ ЗДЕСЬ: Отправляем UUID и в случае ошибки ---
      this.logger.error(`Failed to link account: ${error.message}`);
      client.emit('linkStatus', {
        success: false,
        minecraftUuid: data.minecraftUuid,
        error: error.message
      });
    }
  }

}
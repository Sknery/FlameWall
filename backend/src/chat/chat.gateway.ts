// backend/src/chat/chat.gateway.ts

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
import { EditMessageDto } from 'src/messages/dto/edit-message.dto';
import { DeleteMessageDto } from 'src/messages/dto/delete-message.dto';
import { LinkingService } from 'src/linking/linking.service';
import { ConfigService } from '@nestjs/config';

// DTOs
class LinkAccountDto {
  code: string;
  minecraftUuid: string;
  minecraftUsername: string;
}

class PlayerStatusDto {
  minecraftUuid: string;
  isOnline: boolean;
}

class InGameMessageDto {
    senderUuid: string;
    recipientUsername: string;
    content: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private logger: Logger = new Logger('ChatGateway');
  private onlineUsers = new Map<number, string>();
  private currentlyViewing = new Map<number, number>();
  private readonly pluginSecretKey: string;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly friendshipsService: FriendshipsService,
    private readonly linkingService: LinkingService,
    private readonly configService: ConfigService,
  ) {
    const key = this.configService.get<string>('PLUGIN_SECRET_KEY');
    if (!key) {
      throw new Error('PLUGIN_SECRET_KEY is not defined in .env file!');
    }
    this.pluginSecretKey = key;
  }

  async handleConnection(client: Socket) {
    this.logger.debug(`New connection headers: ${JSON.stringify(client.handshake.headers)}`);

    const apiKey = client.handshake.headers['x-api-key'];
    if (apiKey && apiKey === this.pluginSecretKey) {
      this.logger.log('Minecraft Plugin connected successfully!');
      client['isPlugin'] = true;
      client.join('minecraft-plugins');
      return;
    }

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

    const savedMessage = await this.messagesService.createMessage(sender, recipient, data.content, data.parentMessageId);
    if (!savedMessage) return;
    
    // --- НАЧАЛО: ВОЗВРАЩАЕМ ЛОГИКУ УВЕДОМЛЕНИЙ ---
    const recipientIsViewing = this.currentlyViewing.get(recipient.id) === sender.id;

    if (recipientIsViewing) {
      this.logger.log(`Recipient ${recipient.id} is viewing chat with ${sender.id}. Notification suppressed.`);
    } else if (sender.id !== recipient.id) {
      this.eventEmitter.emit('message.sent', { sender, recipient });
    }
    // --- КОНЕЦ ЛОГИКИ УВЕДОМЛЕНИЙ ---

    // Отправляем на сайт
    this.server.to(`user-${recipient.id}`).emit('newMessage', savedMessage);
    if (sender.id !== recipient.id) {
      this.server.to(`user-${sender.id}`).emit('newMessage', savedMessage);
    }

    // Отправляем в игру
 if (recipient.is_minecraft_online && recipient.minecraft_uuid) {
        this.logger.log(`Forwarding message from ${sender.username} to Minecraft player ${recipient.username}`);
        this.server.to('minecraft-plugins').emit('webPrivateMessage', {
            recipientUuid: recipient.minecraft_uuid,
            // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
            senderUsername: sender.minecraft_username || sender.username,
            content: data.content,
        });
    }
  }

  @SubscribeMessage('inGamePrivateMessage')
  async handleInGameMessage(
    @MessageBody() data: InGameMessageDto,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    if (!client['isPlugin']) return;

    this.logger.log(`Received in-game message from UUID ${data.senderUuid} to MC username ${data.recipientUsername}`);
    
    const sender = await this.usersService.findUserByMinecraftUuid(data.senderUuid);
    const recipient = await this.usersService.findOneByMinecraftUsername(data.recipientUsername);

    if (!sender || !recipient) {
      this.logger.warn(`Could not find sender or recipient for in-game message. Sender UUID: ${data.senderUuid}, Recipient MC Username: ${data.recipientUsername}`);
      return;
    }

    const savedMessage = await this.messagesService.createMessage(sender, recipient, data.content);

    if (savedMessage) {
      // --- НАЧАЛО: ВОЗВРАЩАЕМ ЛОГИКУ УВЕДОМЛЕНИЙ ---
      const recipientIsViewing = this.currentlyViewing.get(recipient.id) === sender.id;

      if (recipientIsViewing) {
        this.logger.log(`Recipient ${recipient.id} is viewing chat with ${sender.id}. Notification suppressed.`);
      } else if (sender.id !== recipient.id) {
        this.eventEmitter.emit('message.sent', { sender, recipient });
      }
      // --- КОНЕЦ ЛОГИКИ УВЕДОМЛЕНИЙ ---

      // 1. Отправляем сообщение на сайт обоим пользователям
      this.server.to(`user-${sender.id}`).emit('newMessage', savedMessage);
      this.server.to(`user-${recipient.id}`).emit('newMessage', savedMessage);

      // 2. Проверяем, онлайн ли получатель в игре, чтобы переслать ему сообщение
    if (recipient.is_minecraft_online && recipient.minecraft_uuid) {
        this.logger.log(`Forwarding in-game message from ${sender.username} to Minecraft player ${recipient.username}`);
        this.server.to('minecraft-plugins').emit('webPrivateMessage', {
          recipientUuid: recipient.minecraft_uuid,
          // --- И ИЗМЕНЕНИЕ ЗДЕСЬ ---
          senderUsername: sender.minecraft_username || sender.username,
          content: data.content,
        });
      }
    }
  }

  // --- Остальные методы (edit, delete, link, status update и т.д.) остаются без изменений ---

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

  @SubscribeMessage('minecraftPlayerStatus')
  async handlePlayerStatusUpdate(
    @MessageBody() data: PlayerStatusDto,
    @ConnectedSocket() client: Socket
  ): Promise<void> {
    if (!client['isPlugin']) {
      this.logger.warn(`Received 'minecraftPlayerStatus' from non-plugin client. SID: ${client.id}`);
      return;
    }

    this.logger.log(`Received status update for UUID ${data.minecraftUuid}: isOnline=${data.isOnline}`);
    
    const updatedUser = await this.usersService.setMinecraftOnlineStatus(data.minecraftUuid, data.isOnline);
    
    if (updatedUser) {
      this.logger.log(`Successfully updated online status for user ${updatedUser.username}.`);
      this.server.to(`user-${updatedUser.id}`).emit('userStatusUpdate', {
        userId: updatedUser.id,
        is_minecraft_online: updatedUser.is_minecraft_online,
      });
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
      client.emit('linkStatus', {
        success: true,
        minecraftUuid: linkedUser.minecraft_uuid,
        websiteUsername: linkedUser.username
      });
      this.server.to(`user-${linkedUser.id}`).emit('linkStatus', { success: true, minecraftUsername: linkedUser.minecraft_username });
    } catch (error) {
      this.logger.error(`Failed to link account: ${error.message}`);
      client.emit('linkStatus', {
        success: false,
        minecraftUuid: data.minecraftUuid,
        error: error.message
      });
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
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private eventEmitter: EventEmitter2,
  ) {}

  private async create(user: User, title: string, message: string, type: string, link: string | null = null): Promise<void> {
    try {
      const notification = this.notificationsRepository.create({
        user: user,
        user_id: user.id,
        title,
        message,
        type,
        link,
      });
      const savedNotification = await this.notificationsRepository.save(notification);
      
      this.eventEmitter.emit('notification.created', savedNotification);
      
      this.logger.log(`Notification created for user ${user.id}`);
    } catch (error) {
      this.logger.error(`Failed to create notification for user ${user.id}`, error.stack);
    }
  }

  @OnEvent('friendship.accepted', { async: true })
  async handleFriendshipAccepted(payload: { requester: User, receiver: User }) {
    this.logger.log('Event caught: friendship.accepted', payload);
    const { requester, receiver } = payload;
    const title = 'Friend Request Accepted';
    const message = `${receiver.username} accepted your friend request.`;
    await this.create(requester, title, message, 'friendship.accepted', `/users/${receiver.id}`);
  }

  @OnEvent('friendship.requested', { async: true })
  async handleFriendshipRequested(payload: { requester: User, receiver: User }) {
    this.logger.log('Event caught: friendship.requested', payload);
    const { requester, receiver } = payload;
    const title = 'New Friend Request';
    const message = `${requester.username} wants to be your friend.`;
    await this.create(receiver, title, message, 'friendship.requested', '/friends');
  }

  // НОВЫЙ ОБРАБОТЧИК СОБЫТИЯ
  @OnEvent('message.sent', { async: true })
  async handleMessageSent(payload: { sender: User, recipient: User }) {
    this.logger.log('Event caught: message.sent', payload);
    const { sender, recipient } = payload;
    
    const title = 'New Message';
    const message = `You have a new message from ${sender.username}.`;
    const link = `/messages/${sender.id}`;
    
    // Создаем уведомление для ПОЛУЧАТЕЛЯ сообщения
    await this.create(recipient, title, message, 'message.sent', link);
  }

  async getForUser(userId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: 30,
    });
  }

  async markAsRead(notificationId: number, userId: number): Promise<Notification> {
    const notification = await this.notificationsRepository.findOneBy({ 
      notification_id: notificationId, 
      user_id: userId
    });

    if (!notification) {
      throw new NotFoundException('Notification not found or you do not have permission to access it.');
    }
    notification.read = true;
    return this.notificationsRepository.save(notification);
  }
}
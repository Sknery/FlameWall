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
        user,
        title,
        message,
        type,
        link,
      });
      const savedNotification = await this.notificationsRepository.save(notification);
      
      const populatedNotification = await this.notificationsRepository.findOne({
          where: { notification_id: savedNotification.notification_id },
          relations: ['user']
      });

      this.eventEmitter.emit('notification.created', populatedNotification);
      
      this.logger.log(`Notification created for user ${user.id} of type [${type}]`);
    } catch (error) {
      this.logger.error(`Failed to create notification for user ${user.id}`, error.stack);
    }
  }

  // --- Слушатели событий остаются без изменений ---

  @OnEvent('friendship.accepted', { async: true })
  async handleFriendshipAccepted(payload: { requester: User, receiver: User }) {
    const { requester, receiver } = payload;
    const title = 'Friend Request Accepted';
    const message = `${receiver.username} is now your friend.`;
    const link = `/users/${receiver.id}`;
    await this.create(requester, title, message, 'friendship.accepted', link);
  }

  @OnEvent('friendship.requested', { async: true })
  async handleFriendshipRequested(payload: { requester: User, receiver: User }) {
    const { requester, receiver } = payload;
    const title = 'New Friend Request';
    const message = `${requester.username} wants to be your friend.`;
    const link = `/friends`;
    await this.create(receiver, title, message, 'friendship.requested', link);
  }

  @OnEvent('message.sent', { async: true })
  async handleMessageSent(payload: { sender: User, recipient: User }) {
    const { sender, recipient } = payload;
    const title = 'New Message';
    const message = `You have a new message from ${sender.username}.`;
    const link = `/messages/${sender.id}`;
    await this.create(recipient, title, message, 'message.sent', link);
  }

  // --- Методы для работы с контроллером ---

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

  // --- НОВЫЙ МЕТОД: Пометить все как прочитанные ---
  async markAllAsRead(userId: number): Promise<{ affected?: number }> {
    const result = await this.notificationsRepository.update(
      { user_id: userId, read: false },
      { read: true },
    );
    this.logger.log(`Marked all as read for user ${userId}. Affected: ${result.affected}`);
    return { affected: result.affected };
  }

  // --- НОВЫЙ МЕТОД: Пометить как прочитанные по ссылке ---
  async markAsReadByLink(userId: number, link: string): Promise<{ affected?: number }> {
      const result = await this.notificationsRepository.update(
          { user_id: userId, link: link, read: false },
          { read: true },
      );
      this.logger.log(`Marked as read for user ${userId} by link ${link}. Affected: ${result.affected}`);
      return { affected: result.affected };
  }
}
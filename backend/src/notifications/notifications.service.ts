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
        user, // Можно передавать всю сущность, TypeORM разберется
        title,
        message,
        type,
        link,
      });
      const savedNotification = await this.notificationsRepository.save(notification);
      
      const populatedNotification = await this.notificationsRepository.findOne({
          where: { notification_id: savedNotification.notification_id },
          relations: ['user'] // Убедимся, что в событие пойдет полная сущность
      });

      this.eventEmitter.emit('notification.created', populatedNotification);
      
      this.logger.log(`Notification created for user ${user.id} of type [${type}]`);
    } catch (error) {
      this.logger.error(`Failed to create notification for user ${user.id}`, error.stack);
    }
  }

  // Слушатель: Дружба принята
  @OnEvent('friendship.accepted', { async: true })
  async handleFriendshipAccepted(payload: { requester: User, receiver: User }) {
    const { requester, receiver } = payload;
    const title = 'Friend Request Accepted';
    const message = `${receiver.username} is now your friend.`;
    const link = `/users/${receiver.id}`; // Ссылка на профиль нового друга
    await this.create(requester, title, message, 'friendship.accepted', link);
  }

  // Слушатель: Пришел новый запрос в друзья
  @OnEvent('friendship.requested', { async: true })
  async handleFriendshipRequested(payload: { requester: User, receiver: User }) {
    const { requester, receiver } = payload;
    const title = 'New Friend Request';
    const message = `${requester.username} wants to be your friend.`;
    const link = `/friends`; // Ссылка на страницу управления друзьями
    await this.create(receiver, title, message, 'friendship.requested', link);
  }

  // Слушатель: Пришло новое сообщение в чате
  @OnEvent('message.sent', { async: true })
  async handleMessageSent(payload: { sender: User, recipient: User }) {
    const { sender, recipient } = payload;
    const title = 'New Message';
    const message = `You have a new message from ${sender.username}.`;
    const link = `/messages/${sender.id}`; // Ссылка на диалог с отправителем
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
}
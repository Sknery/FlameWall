import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { recentMessageSignatures } from '../chat/connection-lock'; // <-- Импортируем замок

@Injectable()
export class MessagesService {
  private logger: Logger = new Logger('MessagesService');

  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async createMessage(sender: User, receiver: User, content: string): Promise<Message | null> {
    // Создаем уникальный "отпечаток" сообщения
    const signature = `${sender.id}-${receiver.id}-${content}`;

    // Проверяем, не обрабатывали ли мы точно такое же сообщение только что
    if (recentMessageSignatures.has(signature)) {
      this.logger.warn(`Duplicate message signature detected, ignoring: ${signature}`);
      return null; // Если да, игнорируем
    }

    // Если нет, добавляем отпечаток в замок и устанавливаем таймер на его удаление
    recentMessageSignatures.add(signature);
    setTimeout(() => {
      recentMessageSignatures.delete(signature);
    }, 2000); // Сообщение считается уникальным в течение 2 секунд

    // Продолжаем обычное сохранение
    const message = this.messagesRepository.create({
      sender: sender,
      receiver: receiver,
      content: content,
    });

    try {
      const savedMessage = await this.messagesRepository.save(message);
      this.logger.log(`Message saved successfully with ID: ${savedMessage.id}`);
      return savedMessage;
    } catch (error) {
      this.logger.error(`Failed to save message to database.`, error.stack);
      recentMessageSignatures.delete(signature); // Удаляем подпись в случае ошибки
      return null;
    }
  }

  async getConversation(userId1: number, userId2: number): Promise<Message[]> {
    return this.messagesRepository.find({
      where: [
        { sender_id: userId1, receiver_id: userId2 },
        { sender_id: userId2, receiver_id: userId1 },
      ],
      relations: ['sender', 'receiver'],
      order: {
        sent_at: 'ASC',
      },
    });
  }
}
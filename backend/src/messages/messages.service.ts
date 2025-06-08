import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Repository, MoreThan } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MessagesService {
  private logger: Logger = new Logger('MessagesService');

  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async createMessage(sender: User, receiver: User, content: string): Promise<Message | null> {
    this.logger.log(`[createMessage] Received request to create message from user #${sender.id} to #${receiver.id}`);

    // ЗАЩИТА ОТ ДУБЛИРОВАНИЯ:
    const twoSecondsAgo = new Date(Date.now() - 2000);
    const existingMessage = await this.messagesRepository.findOne({
      where: {
        sender_id: sender.id,
        receiver_id: receiver.id,
        content: content,
        sent_at: MoreThan(twoSecondsAgo),
      }
    });

    if (existingMessage) {
      this.logger.warn(`[createMessage] Duplicate message detected from user #${sender.id}. Ignoring.`);
      return null;
    }

    const message = this.messagesRepository.create({
      sender: sender,
      receiver: receiver,
      content: content,
    });

    try {
      const savedMessage = await this.messagesRepository.save(message);
      this.logger.log(`[createMessage] Message saved successfully with ID: ${savedMessage.id}`);
      return savedMessage;
    } catch (error) {
      this.logger.error(`[createMessage] Failed to save message to database.`, error.stack);
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
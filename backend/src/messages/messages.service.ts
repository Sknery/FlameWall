import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { recentMessageSignatures } from '../chat/connection-lock';

@Injectable()
export class MessagesService {
  private logger: Logger = new Logger('MessagesService');

  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async createMessage(sender: User, receiver: User, content: string, parentMessageId?: number): Promise<Message | null> {
    const signature = `${sender.id}-${receiver.id}-${content}`;
    if (recentMessageSignatures.has(signature)) {
      this.logger.warn(`Duplicate message signature detected, ignoring: ${signature}`);
      return null;
    }
    recentMessageSignatures.add(signature);
    setTimeout(() => {
      recentMessageSignatures.delete(signature);
    }, 2000);

    const message = this.messagesRepository.create({
      sender: sender,
      receiver: receiver,
      content: content,
      parentMessageId: parentMessageId,
    });

    try {
      const savedMessage = await this.messagesRepository.save(message);
      return this.findMessageById(savedMessage.id);
    } catch (error) {
      this.logger.error(`Failed to save message.`, error.stack);
      recentMessageSignatures.delete(signature);
      return null;
    }
  }

  async updateMessage(userId: number, messageId: number, content: string): Promise<Message> {
    const message = await this.findMessageById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found.');
    }
    if (message.sender_id !== userId) {
      throw new ForbiddenException('You can only edit your own messages.');
    }
    message.content = content;
    const updatedMessage = await this.messagesRepository.save(message);
    return updatedMessage;
  }

  async deleteMessage(userId: number, messageId: number): Promise<Message> {
    const message = await this.findMessageById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found.');
    }
    if (message.sender_id !== userId) {
      throw new ForbiddenException('You can only delete your own messages.');
    }
    message.is_deleted = true;
    message.content = 'Message has been deleted.';
    return this.messagesRepository.save(message);
  }

  async getConversation(userId1: number, userId2: number): Promise<Message[]> {
    return this.messagesRepository.find({
      where: [
        { sender_id: userId1, receiver_id: userId2 },
        { sender_id: userId2, receiver_id: userId1 },
      ],
      relations: [
        'sender',
        'receiver',
        'parentMessage',
        'parentMessage.sender',
      ],
      order: {
        sent_at: 'ASC',
      },
    });
  }
  
  async findMessageById(id: number): Promise<Message | null> {
    return this.messagesRepository.findOne({
      where: { id },
      relations: ['sender', 'receiver', 'parentMessage', 'parentMessage.sender'],
    });
  }
}
// backend/src/linking/linking.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { LinkCode } from './entities/link-code.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class LinkingService {
  constructor(
    @InjectRepository(LinkCode)
    private linkCodeRepository: Repository<LinkCode>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async generateCodeForUser(userId: number): Promise<string> {
    await this.linkCodeRepository.delete({ userId });

    const user = await this.usersRepository.findOneBy({ id: userId });

    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ: Добавляем проверку на существование пользователя ---
    if (!user) {
      // Этот случай маловероятен, так как ID берется из токена, но проверка важна
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }

    if (user.minecraft_uuid) {
      throw new ConflictException('This website account is already linked to a Minecraft account.');
    }

    const code = randomBytes(3).toString('hex').toUpperCase();
    const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

    const newLinkCode = this.linkCodeRepository.create({
      code,
      userId,
      expires_at,
    });

    await this.linkCodeRepository.save(newLinkCode);
    return code;
  }

  async verifyCodeAndLinkAccount(code: string, minecraftUuid: string, minecraftUsername: string): Promise<User> {
    const linkCode = await this.linkCodeRepository.findOne({ where: { code } });

    if (!linkCode || linkCode.expires_at < new Date()) {
      throw new NotFoundException('Invalid or expired link code.');
    }
    
    const [userToUpdate, existingLinkedUser] = await Promise.all([
        this.usersRepository.findOneBy({ id: linkCode.userId }),
        this.usersRepository.findOneBy({ minecraft_uuid: minecraftUuid })
    ]);

    if (existingLinkedUser) {
        throw new ConflictException('This Minecraft account is already linked to another website account.');
    }

    if (!userToUpdate) {
      throw new NotFoundException('User associated with this code not found.');
    }

    userToUpdate.minecraft_uuid = minecraftUuid;
    userToUpdate.minecraft_username = minecraftUsername;

    const savedUser = await this.usersRepository.save(userToUpdate);
    await this.linkCodeRepository.remove(linkCode);

    return savedUser;
  }
}
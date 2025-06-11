// backend/src/linking/linking.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkingService } from './linking.service';
import { LinkingController } from './linking.controller';
import { LinkCode } from './entities/link-code.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LinkCode, User])],
  providers: [LinkingService],
  controllers: [LinkingController],
  exports: [LinkingService], // Экспортируем сервис для ChatGateway
})
export class LinkingModule {}
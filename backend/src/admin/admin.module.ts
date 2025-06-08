import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
// UsersModule больше импортировать не нужно

@Module({
  imports: [], // <-- Теперь массив импортов пуст
  controllers: [AdminController]
})
export class AdminModule {}
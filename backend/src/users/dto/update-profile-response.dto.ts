import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

// Этот DTO описывает объект, который мы возвращаем после обновления профиля
export class UpdateProfileResponseDto {
  @ApiProperty({ description: 'A new JWT token with updated user data' })
  access_token: string;

  // Для документации мы можем использовать полную сущность User,
  // так как PublicUser - это лишь тип, а не класс.
  @ApiProperty({ type: User })
  user: User;
}
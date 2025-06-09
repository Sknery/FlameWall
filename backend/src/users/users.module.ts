import { Module, Global } from '@nestjs/common'; // Импортируем Global
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';


@Global() // <-- ДЕЛАЕМ МОДУЛЬ ГЛОБАЛЬНЫМ
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
],
  
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService], // Экспортируем UsersService для всех
})
export class UsersModule {}
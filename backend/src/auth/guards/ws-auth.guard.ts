import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  canActivate(
    context: ExecutionContext, // <-- ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЙ ТИП
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const authorizationHeader = client.handshake?.headers?.authorization;

    if (!authorizationHeader || typeof authorizationHeader !== 'string') {
      this.logger.error('WS Guard: No authorization header found.');
      return false;
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
      this.logger.error('WS Guard: No token found in header.');
      return false;
    }

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      // Это критическая ошибка конфигурации сервера
      this.logger.error('WS Guard: JWT_SECRET is not configured on the server.');
      return false;
    }

    try {
      const payload = verify(token, jwtSecret);
      if (typeof payload === 'string') {
        // Полезная нагрузка не должна быть строкой
        this.logger.error('WS Guard: Invalid token payload type.');
        return false;
      }

      // После успешной верификации токена, мы просто прикрепляем payload.
      // Сам ChatGateway будет отвечать за поиск пользователя в базе.
      client['user_payload'] = payload; // Используем другое имя, чтобы не путать с полной сущностью
      return true;
    } catch (e) {
      this.logger.error(`WS Guard: Token verification failed - ${e.message}`);
      return false;
    }
  }
}
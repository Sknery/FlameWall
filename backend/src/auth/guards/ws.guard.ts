import { CanActivate, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class WsGuard implements CanActivate {
  canActivate(context: any): boolean {
    const client: Socket = context.switchToWs().getClient();
    // Просто проверяем, был ли пользователь успешно прикреплен к сокету ранее
    return !!client['user'];
  }
}
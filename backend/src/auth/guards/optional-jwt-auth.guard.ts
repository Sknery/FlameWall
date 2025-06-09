import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Этот метод переопределяет стандартное поведение AuthGuard.
   * Если токен есть и он валиден, `user` будет объектом пользователя.
   * Если токена нет или он невалиден, метод не будет выбрасывать ошибку 401,
   * а просто вернет `null` (или `false` в зависимости от Passport),
   * и `req.user` в контроллере будет `undefined`.
   */
  handleRequest(err, user, info, context) {
    return user;
  }
}
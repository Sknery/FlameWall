import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService, PublicUser } from '../users/users.service'; 

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new InternalServerErrorException('JWT_SECRET is not defined in environment variables. Application cannot start.');
    }

    super({ 
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any): Promise<{ userId: number; username: string; rank: string }> {
    console.log('JWT Strategy - validate method called with payload:', payload);
    const user: PublicUser | null = await this.usersService.findOne(payload.sub); 
    console.log('User found by strategy:', user);
    if (!user) {
        console.error('JWT Strategy - User not found for id:', payload.sub);
        throw new UnauthorizedException('User not found or token invalid');
    }
    return { userId: user.id, username: user.username, rank: user.rank };
  }
}
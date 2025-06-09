import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UsersService, PublicUser } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto'; 
import { User } from '../users/entities/user.entity';
// --- ДОБАВЛЕНО: Импорт DTO и bcrypt ---
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<PublicUser | null> {
    const user: User | null = await this.usersService.findOneWithPasswordByEmail(email);
    
    if (!user) return null;

    if (user.is_banned) {
      throw new ForbiddenException('This account has been banned.');
    }
    
    if (await user.validatePassword(pass)) {
      const { password_hash, validatePassword, ...publicData } = user;
      return publicData as PublicUser; 
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const userPayload: PublicUser | null = await this.validateUser(loginDto.email, loginDto.password);
    if (!userPayload) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const jwtTokenPayload = { username: userPayload.username, sub: userPayload.id, rank: userPayload.rank };
    return {
      access_token: this.jwtService.sign(jwtTokenPayload),
      user: userPayload 
    };
  }

  async register(createUserDto: CreateUserDto): Promise<PublicUser> {
    return this.usersService.create(createUserDto);
  }

  // --- НОВЫЙ МЕТОД: Смена пароля ---
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.usersService.findOneWithPasswordById(userId);
    if (!user) {
        throw new ForbiddenException('User not found.');
    }

    const isPasswordMatching = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.password_hash,
    );

    if (!isPasswordMatching) {
        throw new UnauthorizedException('Wrong current password.');
    }

    const newHashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    
    await this.usersService.updatePassword(userId, newHashedPassword);
  }
}
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto'; 
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<Omit<User, 'password_hash' | 'password' | 'validatePassword' | 'hashPasswordMethod'> | null> {
    const user = await this.usersService.findOneWithPasswordByEmail(email);
    if (user && await user.validatePassword(pass)) {
      const { password_hash, password, validatePassword, hashPasswordMethod, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const userPayload = await this.validateUser(loginDto.email, loginDto.password);
    if (!userPayload) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { username: userPayload.username, sub: userPayload.id, rank: userPayload.rank };
    return {
      access_token: this.jwtService.sign(payload),
      user: userPayload
    };
  }

  async register(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService, PublicUser } from '../users/users.service';
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

  async validateUser(email: string, pass: string): Promise<PublicUser | null> {
    const user: User | null = await this.usersService.findOneWithPasswordByEmail(email);
    
    if (user && await user.validatePassword(pass)) {
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
}
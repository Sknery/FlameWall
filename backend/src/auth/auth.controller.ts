import { Controller, Post, Body, UsePipes, ValidationPipe, Request, UseGuards, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsersService, PublicUser } from '../users/users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Authentication & Profiles')
@Controller('auth')
export class AuthController {
  constructor(
      private authService: AuthService,
      private usersService: UsersService, 
    ) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile') 
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getProfile(@Request() req): Promise<PublicUser> {
    console.log('AUTH CONTROLLER - getProfile called. req.user:', req.user);
    const userId = req.user.userId; 
    return this.usersService.findOne(userId);
  }

    @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, changePasswordDto);
  }
}
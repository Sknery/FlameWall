import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  ParseIntPipe, 
  UsePipes, 
  ValidationPipe, 
  Patch, 
  UseGuards, 
  Request,
  Delete,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { UsersService, PublicUser } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { UpdateProfileResponseDto } from './dto/update-profile-response.dto';


@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (for future admin use)' })
  @ApiResponse({ status: 201, description: 'User created successfully.', type: User })
  @ApiResponse({ status: 409, description: 'Conflict. Email already exists.'})
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my profile' })
  // --- ИЗМЕНЕНО: Обновляем тип в декораторе Swagger ---
  @ApiResponse({ status: 200, description: 'Profile updated successfully.', type: UpdateProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 409, description: 'Conflict. Profile slug is already in use.'})
  // --- ИЗМЕНЕНО: Обновляем тип возвращаемого значения ---
  updateMyProfile(@Request() req, @Body() updateUserDto: UpdateUserDto): Promise<{ user: PublicUser; access_token: string; }> {
    const userId = req.user.userId;
    return this.usersService.updateProfile(userId, updateUserDto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete my account' })
  @ApiResponse({ status: 204, description: 'Account deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  deleteMyAccount(@Request() req): Promise<void> {
    const userId = req.user.userId;
    return this.usersService.softDeleteUser(userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.', type: [User] })
  findAll() {
    return this.usersService.findAll();
  }

 @Get(':identifier')
  @ApiOperation({ summary: 'Get a single user by ID or slug' })
  @ApiResponse({ status: 200, description: 'Return a single user.', type: User })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('identifier') identifier: string) {
    // Пробуем преобразовать в число. Если получается - ищем по ID, если нет - по slug (строке)
    const idAsNumber = parseInt(identifier, 10);
    const queryIdentifier = isNaN(idAsNumber) ? identifier : idAsNumber;
    return this.usersService.findOne(queryIdentifier);
  }

  
}
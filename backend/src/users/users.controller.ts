import { 
  Controller, Get, Post, Body, Param, UsePipes, ValidationPipe, Patch, UseGuards, Request, Delete, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, Logger, BadRequestException
} from '@nestjs/common';
import { PublicUser, UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { UpdateProfileResponseDto } from './dto/update-profile-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

const generateUniqueFilename = (req, file, callback) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = extname(file.originalname);
  callback(null, `${uniqueSuffix}${extension}`);
};

@ApiTags('Users')
@Controller('users')
export class UsersController {

    private readonly logger = new Logger(UsersController.name);

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

@Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: generateUniqueFilename,
    }),
  }))
  async uploadAvatar(
    @Request() req,
    @UploadedFile(
      // --- ИЗМЕНЕНО: Убираем FileTypeValidator, оставляем только проверку размера ---
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5 MB
        ],
        // Делаем пайп опциональным, чтобы наша ручная проверка могла выполниться первой
        fileIsRequired: true,
      }),
    ) file: Express.Multer.File,
  ) {
    this.logger.log(`Attempting to upload avatar for user: ${req.user.userId}`);
    // --- ДОБАВЛЕНО: Логируем полученный файл, чтобы увидеть его свойства ---
    this.logger.debug(`File metadata: ${JSON.stringify(file)}`);

    // --- ДОБАВЛЕНО: Ручная, надежная проверка MIME-типа ---
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        this.logger.error(`Invalid file type uploaded: ${file.mimetype}`);
        throw new BadRequestException(`Invalid file type. Only JPEG, PNG, and GIF are allowed.`);
    }

    const userId = req.user.userId;
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatar(userId, avatarUrl);
  }

  @Post('me/banner')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/banners',
      filename: generateUniqueFilename,
    }),
  }))
  async uploadBanner(
    @Request() req,
    @UploadedFile(
      // --- ИЗМЕНЕНО: Убираем FileTypeValidator ---
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10 MB
        ],
        fileIsRequired: true,
      }),
    ) file: Express.Multer.File,
  ) {
    this.logger.log(`Attempting to upload banner for user: ${req.user.userId}`);
    this.logger.debug(`File metadata: ${JSON.stringify(file)}`);

    // --- ДОБАВЛЕНО: Ручная, надежная проверка MIME-типа ---
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        this.logger.error(`Invalid file type uploaded: ${file.mimetype}`);
        throw new BadRequestException(`Invalid file type. Only JPEG, PNG, and GIF are allowed.`);
    }

    const userId = req.user.userId;
    const bannerUrl = `/uploads/banners/${file.filename}`;
    return this.usersService.updateBanner(userId, bannerUrl);
  }
}
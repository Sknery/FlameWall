import { Controller, Post, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService, PublicUser } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Ranks } from '../common/enums/ranks.enum';
import { User } from '../users/entities/user.entity';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) 
@ApiBearerAuth()
export class AdminController {
    constructor(private readonly usersService: UsersService) {}

    @Post('/users/:id/ban')
    @Roles(Ranks.ADMIN, Ranks.MODERATOR, Ranks.OWNER) 
    @ApiOperation({ summary: 'Ban a user' })
    @ApiResponse({ status: 200, description: 'User has been banned successfully.', type: User })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    banUser(@Param('id', ParseIntPipe) id: number): Promise<PublicUser> {
        return this.usersService.banUser(id);
    }

    @Post('/users/:id/unban')
    @Roles(Ranks.ADMIN, Ranks.MODERATOR, Ranks.OWNER)
    @ApiOperation({ summary: 'Unban a user' })
    @ApiResponse({ status: 200, description: 'User has been unbanned successfully.', type: User })
    @ApiResponse({ status: 403, description: 'Forbidden.' })
    @ApiResponse({ status: 404, description: 'User not found.' })
    unbanUser(@Param('id', ParseIntPipe) id: number): Promise<PublicUser> {
        return this.usersService.unbanUser(id);
    }
}
import { Controller, Get, Param, ParseIntPipe, UseGuards, Post, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard) // Все эндпоинты в этом контроллере требуют авторизации
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get current user's notifications" })
  @ApiResponse({ status: 200, description: 'A list of notifications', type: [Notification] })
  getNotifications(@Request() req) {
    return this.notificationsService.getForUser(req.user.userId);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read', type: Notification })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  markAsRead(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }
}
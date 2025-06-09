import { Controller, Get, Param, ParseIntPipe, UseGuards, Post, HttpCode, HttpStatus, Request, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
// --- ДОБАВЛЕНО: Импортируем DTO ---
import { MarkAsReadByLinkDto } from './dto/mark-as-read-by-link.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
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

  // --- НОВЫЙ ЭНДПОИНТ: Пометить все как прочитанные ---
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read.' })
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  // --- НОВЫЙ ЭНДПОИНТ: Пометить как прочитанные по ссылке ---
  @Post('read-by-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notifications as read by link' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read.' })
  markAsReadByLink(@Request() req, @Body() dto: MarkAsReadByLinkDto) {
    return this.notificationsService.markAsReadByLink(req.user.userId, dto.link);
  }
}
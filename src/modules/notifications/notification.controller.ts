import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
import {
  MarkNotificationAsReadDto,
  MarkAllNotificationsAsReadDto,
} from './dto/notification.dto';
import { Notification } from './entities/notification.entity';

@ApiTags('Thông báo (Notifications)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ version: '1' })
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách thông báo của tôi' })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { default: 1, type: 'number' },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { default: 20, type: 'number' },
  })
  @ApiOkResponse({ description: 'Danh sách thông báo', type: [Notification] })
  async getUserNotifications(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return await this.notificationService.getUserNotifications(
      req.user.id,
      +page,
      +limit,
    );
  }

  @Get('unread')
  @ApiOperation({ summary: 'Danh sách thông báo chưa đọc' })
  @ApiOkResponse({ description: 'Thông báo chưa đọc', type: [Notification] })
  async getUnreadNotifications(@Request() req) {
    return await this.notificationService.getUnreadNotifications(req.user.id);
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Số lượng thông báo chưa đọc' })
  @ApiOkResponse({ schema: { example: { count: 3 } } })
  async getUnreadCount(@Request() req) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Đánh dấu đã đọc một thông báo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Thông báo sau cập nhật', type: Notification })
  async markAsRead(@Request() req, @Param('id') id: string) {
    const markAsReadDto: MarkNotificationAsReadDto = { notificationId: +id };
    return await this.notificationService.markAsRead(markAsReadDto);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Đánh dấu đã đọc tất cả thông báo' })
  @ApiOkResponse({
    schema: { example: { message: 'All notifications marked as read' } },
  })
  async markAllAsRead(@Request() req) {
    const markAllAsReadDto: MarkAllNotificationsAsReadDto = {
      userId: req.user.id,
    };
    await this.notificationService.markAllAsRead(markAllAsReadDto);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một thông báo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    schema: { example: { message: 'Notification deleted successfully' } },
  })
  async deleteNotification(@Request() req, @Param('id') id: string) {
    await this.notificationService.deleteNotification(+id, req.user.id);
    return { message: 'Notification deleted successfully' };
  }

  @Delete()
  @ApiOperation({ summary: 'Xóa tất cả thông báo của tôi' })
  @ApiOkResponse({
    schema: { example: { message: 'All notifications deleted successfully' } },
  })
  async deleteAllNotifications(@Request() req) {
    await this.notificationService.deleteAllNotifications(req.user.id);
    return { message: 'All notifications deleted successfully' };
  }
}

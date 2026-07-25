import { NotificationService } from './notification.service';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import {
  Get,
  Patch,
  Param,
  Query,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  MarkAllReadResponseDto,
  NotificationResponseDto,
  UnreadCountResponseDto,
} from './dto/notification-response.dto';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({
    summary: 'List notifications for the authenticated user',
  })
  @ApiOkResponse({ type: NotificationResponseDto, isArray: true })
  findMine(@ActiveUser() userId: number, @Query() query: QueryNotificationDto) {
    return this.notificationService.findMine(userId, query);
  }

  @Get('unread')
  @ApiOperation({
    summary: 'List unread notifications for the authenticated user',
  })
  @ApiOkResponse({ type: NotificationResponseDto, isArray: true })
  findUnread(
    @ActiveUser() userId: number,
    @Query() query: QueryNotificationDto,
  ) {
    return this.notificationService.findUnread(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get unread notification count for the authenticated user',
  })
  @ApiOkResponse({ type: UnreadCountResponseDto })
  countUnread(@ActiveUser() userId: number) {
    return this.notificationService.countUnread(userId);
  }

  @Patch('read-all')
  @ApiOperation({
    summary: 'Mark all unread notifications as read',
  })
  @ApiOkResponse({ type: MarkAllReadResponseDto })
  markAllAsRead(@ActiveUser() userId: number) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification by id (own only)' })
  @ApiOkResponse({ type: NotificationResponseDto })
  findOne(@ActiveUser() userId: number, @Param('id', ParseIntPipe) id: number) {
    return this.notificationService.findOne(id, userId);
  }

  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark a notification as read (idempotent)',
  })
  @ApiOkResponse({ type: NotificationResponseDto })
  markAsRead(
    @ActiveUser() userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsRead(id, userId);
  }
}

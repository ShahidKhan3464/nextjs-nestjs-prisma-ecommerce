import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '../constants/notification.constants';

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: 'Whether the notification has been read' })
  isRead: boolean;

  @ApiPropertyOptional({
    description: 'ISO timestamp when the notification was marked read',
    nullable: true,
  })
  readAt: string | null;

  @ApiProperty()
  createdAt: string;
}

export class UnreadCountResponseDto {
  @ApiProperty({ description: 'Number of unread notifications for the user' })
  count: number;
}

export class MarkAllReadResponseDto {
  @ApiProperty({
    description: 'Number of notifications newly marked as read',
  })
  markedCount: number;
}

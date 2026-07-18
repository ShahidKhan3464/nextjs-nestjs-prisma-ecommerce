import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { notificationSelect } from '../utils/notification-query.util';
import { NotificationOwnershipProvider } from './notification-ownership.provider';
import {
  NotificationRow,
  NotificationResponse,
  mapNotificationToResponse,
} from '../utils/map-notification.util';

@Injectable()
export class MarkNotificationReadProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationOwnershipProvider: NotificationOwnershipProvider,
  ) {}

  /**
   * Marks a single notification as read. Idempotent when already read.
   */
  public async markAsRead(
    notificationId: number,
    userId: number,
  ): Promise<NotificationResponse> {
    const notification =
      await this.notificationOwnershipProvider.findOwnedOrThrow(
        notificationId,
        userId,
      );

    if (notification.readAt !== null) {
      return mapNotificationToResponse(notification);
    }

    const updated = (await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
      select: notificationSelect,
    })) as NotificationRow;

    return mapNotificationToResponse(updated);
  }
}

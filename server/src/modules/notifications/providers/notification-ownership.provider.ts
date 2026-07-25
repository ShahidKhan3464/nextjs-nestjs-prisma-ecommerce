import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRow } from '../utils/map-notification.util';
import { findNotification } from '../utils/notification-query.util';

@Injectable()
export class NotificationOwnershipProvider {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Loads a notification owned by the user. Missing or non-owned ids both
   * resolve to NotFound so existence of another user's notifications is not leaked.
   */
  public async findOwnedOrThrow(
    notificationId: number,
    userId: number,
  ): Promise<NotificationRow> {
    const notification = await findNotification(this.prisma, {
      id: notificationId,
      userId,
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }
}

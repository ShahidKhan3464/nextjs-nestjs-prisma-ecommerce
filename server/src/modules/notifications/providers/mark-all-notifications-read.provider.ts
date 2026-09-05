import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MarkAllNotificationsReadProvider {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Marks all unread notifications for the user as read. Idempotent when none
   * are unread (returns markedCount: 0).
   */
  public async markAllAsRead(userId: number): Promise<{ markedCount: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { markedCount: result.count };
  }
}

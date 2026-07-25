import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { notificationSelect } from '../utils/notification-query.util';
import {
  NotificationRow,
  NotificationResponse,
  mapNotificationToResponse,
} from '../utils/map-notification.util';

/**
 * Internal create path for other domain modules (orders, seller, products).
 * Not exposed as a public HTTP endpoint.
 */
@Injectable()
export class CreateNotificationProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async create(
    dto: CreateNotificationDto,
  ): Promise<NotificationResponse> {
    const created = (await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
      },
      select: notificationSelect,
    })) as NotificationRow;

    return mapNotificationToResponse(created);
  }
}

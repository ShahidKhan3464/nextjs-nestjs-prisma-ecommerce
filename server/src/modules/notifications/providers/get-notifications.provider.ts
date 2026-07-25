import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryNotificationDto } from '../dto/query-notification.dto';
import { findNotifications } from '../utils/notification-query.util';
import { PaginationProviders } from 'src/common/pagination/providers/pagination.providers';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';
import {
  NotificationResponse,
  mapNotificationToResponse,
} from '../utils/map-notification.util';

@Injectable()
export class GetNotificationsProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationProviders: PaginationProviders,
  ) {}

  private buildWhere(
    userId: number,
    query: QueryNotificationDto,
    forceUnread = false,
  ): Prisma.NotificationWhereInput {
    const where: Prisma.NotificationWhereInput = { userId };

    if (query.type !== undefined) {
      where.type = query.type;
    }

    if (forceUnread || query.isRead === false) {
      where.readAt = null;
    } else if (query.isRead === true) {
      where.readAt = { not: null };
    }

    return where;
  }

  private async paginate(
    userId: number,
    query: QueryNotificationDto,
    forceUnread = false,
  ): Promise<PaginateQueryResult<NotificationResponse>> {
    const { page, limit, skip } = this.paginationProviders.resolvePaging(query);
    const where = this.buildWhere(userId, query, forceUnread);

    const total = await this.prisma.notification.count({ where });
    const notifications = await findNotifications(this.prisma, {
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: notifications.map(mapNotificationToResponse),
      page,
      limit,
      total,
    };
  }

  /** Authenticated user — their own notifications (optional filters). */
  findByUser(
    userId: number,
    query: QueryNotificationDto,
  ): Promise<PaginateQueryResult<NotificationResponse>> {
    return this.paginate(userId, query);
  }

  /** Authenticated user — unread notifications only. */
  findUnreadByUser(
    userId: number,
    query: QueryNotificationDto,
  ): Promise<PaginateQueryResult<NotificationResponse>> {
    return this.paginate(userId, query, true);
  }
}

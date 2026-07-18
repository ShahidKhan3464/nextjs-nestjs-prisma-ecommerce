import { Injectable } from '@nestjs/common';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetUnreadCountProvider } from './providers/get-unread-count.provider';
import { GetNotificationProvider } from './providers/get-notification.provider';
import { GetNotificationsProvider } from './providers/get-notifications.provider';
import { CreateNotificationProvider } from './providers/create-notification.provider';
import { MarkNotificationReadProvider } from './providers/mark-notification-read.provider';
import { MarkAllNotificationsReadProvider } from './providers/mark-all-notifications-read.provider';

@Injectable()
export class NotificationService {
  constructor(
    private readonly getUnreadCountProvider: GetUnreadCountProvider,
    private readonly getNotificationProvider: GetNotificationProvider,
    private readonly getNotificationsProvider: GetNotificationsProvider,
    private readonly createNotificationProvider: CreateNotificationProvider,
    private readonly markNotificationReadProvider: MarkNotificationReadProvider,
    private readonly markAllNotificationsReadProvider: MarkAllNotificationsReadProvider,
  ) {}

  findMine(userId: number, query: QueryNotificationDto) {
    return this.getNotificationsProvider.findByUser(userId, query);
  }

  findUnread(userId: number, query: QueryNotificationDto) {
    return this.getNotificationsProvider.findUnreadByUser(userId, query);
  }

  countUnread(userId: number) {
    return this.getUnreadCountProvider.countByUser(userId);
  }

  findOne(notificationId: number, userId: number) {
    return this.getNotificationProvider.findOne(notificationId, userId);
  }

  markAsRead(notificationId: number, userId: number) {
    return this.markNotificationReadProvider.markAsRead(notificationId, userId);
  }

  markAllAsRead(userId: number) {
    return this.markAllNotificationsReadProvider.markAllAsRead(userId);
  }

  /** Internal — for other modules to create in-app notifications. */
  create(dto: CreateNotificationDto) {
    return this.createNotificationProvider.create(dto);
  }
}

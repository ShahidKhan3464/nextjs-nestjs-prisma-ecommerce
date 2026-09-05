import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { GetUnreadCountProvider } from './providers/get-unread-count.provider';
import { GetNotificationProvider } from './providers/get-notification.provider';
import { GetNotificationsProvider } from './providers/get-notifications.provider';
import { CreateNotificationProvider } from './providers/create-notification.provider';
import { MarkNotificationReadProvider } from './providers/mark-notification-read.provider';
import { NotificationOwnershipProvider } from './providers/notification-ownership.provider';
import { MarkAllNotificationsReadProvider } from './providers/mark-all-notifications-read.provider';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    GetUnreadCountProvider,
    GetNotificationProvider,
    GetNotificationsProvider,
    CreateNotificationProvider,
    MarkNotificationReadProvider,
    NotificationOwnershipProvider,
    MarkAllNotificationsReadProvider,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}

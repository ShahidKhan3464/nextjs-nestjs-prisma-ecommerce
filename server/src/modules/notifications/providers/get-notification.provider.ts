import { Injectable } from '@nestjs/common';
import { NotificationOwnershipProvider } from './notification-ownership.provider';
import {
  mapNotificationToResponse,
  NotificationResponse,
} from '../utils/map-notification.util';

@Injectable()
export class GetNotificationProvider {
  constructor(
    private readonly notificationOwnershipProvider: NotificationOwnershipProvider,
  ) {}

  public async findOne(
    notificationId: number,
    userId: number,
  ): Promise<NotificationResponse> {
    const notification =
      await this.notificationOwnershipProvider.findOwnedOrThrow(
        notificationId,
        userId,
      );

    return mapNotificationToResponse(notification);
  }
}

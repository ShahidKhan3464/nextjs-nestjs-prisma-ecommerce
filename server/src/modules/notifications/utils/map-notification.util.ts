import type {
  NotificationRow,
  NotificationResponse,
} from '../types/notification.types';

export type {
  NotificationRow,
  NotificationResponse,
} from '../types/notification.types';

export function mapNotificationToResponse(
  notification: NotificationRow,
): NotificationResponse {
  return {
    type: notification.type,
    title: notification.title,
    id: String(notification.id),
    message: notification.message,
    isRead: notification.readAt !== null,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt?.toISOString() ?? null,
  };
}

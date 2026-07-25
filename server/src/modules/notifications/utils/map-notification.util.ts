import { NotificationType } from '../constants/notification.constants';

export type NotificationRow = {
  id: number;
  title: string;
  userId: number;
  message: string;
  createdAt: Date;
  readAt: Date | null;
  type: NotificationType;
};

export type NotificationResponse = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  type: NotificationType;
};

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

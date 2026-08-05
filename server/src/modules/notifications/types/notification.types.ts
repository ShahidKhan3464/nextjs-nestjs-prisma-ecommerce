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

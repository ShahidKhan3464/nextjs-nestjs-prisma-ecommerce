import { NOTIFICATION_TYPES, READ_FILTERS } from "./constants";

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type ReadFilter = (typeof READ_FILTERS)[number];

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListParams = {
  page?: number;
  limit?: number;
  type?: NotificationType;
  isRead?: boolean;
};

export type NotificationListResult = {
  notifications: Notification[];
  page: number;
  limit: number;
  total: number;
};

export type ListFilters = {
  type?: NotificationType;
  isRead?: boolean;
};

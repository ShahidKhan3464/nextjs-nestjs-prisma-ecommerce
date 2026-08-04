import type { ApiResponse } from "@/types";
import { api } from "@/services/api/client";
import type {
  Notification,
  NotificationListParams,
  NotificationListResult,
} from "../types";

export async function fetchNotifications(
  params: NotificationListParams = {}
): Promise<NotificationListResult> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.type) search.set("type", params.type);
  if (params.isRead !== undefined) search.set("isRead", String(params.isRead));

  const qs = search.toString();
  const res = await api.get<ApiResponse<NotificationListResult>>(
    `/api/v1/customer/notifications${qs ? `?${qs}` : ""}`
  );
  return res.data.data;
}

export async function fetchUnreadNotificationCount() {
  const res = await api.get<ApiResponse<{ count: number }>>(
    "/api/v1/customer/notifications/unread-count"
  );
  return res.data.data.count;
}

export async function markNotificationRead(id: string) {
  const res = await api.patch<ApiResponse<{ notification: Notification }>>(
    `/api/v1/customer/notifications/${encodeURIComponent(id)}/read`
  );
  return res.data.data.notification;
}

export async function markAllNotificationsRead() {
  const res = await api.patch<ApiResponse<{ markedCount: number }>>(
    "/api/v1/customer/notifications/read-all"
  );
  return res.data.data.markedCount;
}

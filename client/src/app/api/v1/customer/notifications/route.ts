import type { ApiResponse } from "@/types";
import { requireUser } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";
import type {
  Notification,
  NotificationType,
} from "@/modules/buyer/notifications/types";

type NestNotification = {
  id: string | number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

function mapNotification(row: NestNotification): Notification {
  return {
    id: String(row.id),
    title: row.title,
    message: row.message,
    type: row.type as NotificationType,
    isRead: Boolean(row.isRead),
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const backend = getBackendUrl();
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  const res = await fetch(`${backend}/notifications${qs ? `?${qs}` : ""}`, {
    headers: { ...forwardAuthorization(req) },
  });

  let raw: unknown = null;
  try {
    raw = await res.json();
  } catch {
    raw = null;
  }

  if (!res.ok) {
    return jsonMessage(nestErrorMessage(raw), res.status);
  }

  const payload = unwrapNestDataResponsePayload(raw) as {
    data?: NestNotification[];
    total?: number;
    page?: number;
    limit?: number;
  };

  const notifications = Array.isArray(payload?.data) ? payload.data : [];
  const page = payload?.page ?? Number(searchParams.get("page") ?? 1);
  const limit = payload?.limit ?? Number(searchParams.get("limit") ?? 20);
  const total = payload?.total ?? notifications.length;

  const body: ApiResponse<{
    notifications: Notification[];
    page: number;
    limit: number;
    total: number;
  }> = {
    data: {
      notifications: notifications.map(mapNotification),
      page,
      limit,
      total,
    },
  };
  return jsonOk(body);
}

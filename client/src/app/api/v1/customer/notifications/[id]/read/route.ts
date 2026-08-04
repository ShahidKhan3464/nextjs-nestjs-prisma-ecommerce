import type { ApiResponse } from "@/types";
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
} from "@/modules/customer/notifications/types";

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

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const backend = getBackendUrl();
  const res = await fetch(
    `${backend}/notifications/${encodeURIComponent(id)}/read`,
    {
      method: "PATCH",
      headers: { ...forwardAuthorization(req) },
    }
  );

  let raw: unknown = null;
  try {
    raw = await res.json();
  } catch {
    raw = null;
  }

  if (!res.ok) {
    return jsonMessage(nestErrorMessage(raw), res.status);
  }

  const payload = unwrapNestDataResponsePayload(raw) as NestNotification;
  const body: ApiResponse<{ notification: Notification }> = {
    data: { notification: mapNotification(payload) },
  };
  return jsonOk(body);
}

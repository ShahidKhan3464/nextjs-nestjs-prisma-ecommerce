import { getBackendUrl } from "@/lib/backend-url";
import { requireAdmin } from "@/lib/require-auth";
import type { ApiResponse, Order } from "@/types";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import {
  type NestOrderPayload,
  normalizeNestOrderPayload,
} from "@/lib/nest-order-mapper";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/orders/${encodeURIComponent(id)}`, {
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

  const envelope = raw as {
    data?: { order?: NestOrderPayload; customerUserId?: string };
  };
  const data = envelope?.data;
  if (!data?.order) {
    return jsonMessage("Order not found", 404);
  }

  const body: ApiResponse<{
    order: Order;
    customerUserId: string;
  }> = {
    data: {
      order: normalizeNestOrderPayload(data.order),
      customerUserId: data.customerUserId ?? String(data.order.userId),
    },
  };
  return jsonOk(body);
}

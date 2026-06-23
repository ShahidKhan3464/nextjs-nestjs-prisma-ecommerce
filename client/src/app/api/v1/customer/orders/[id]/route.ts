import { getBackendUrl } from "@/lib/backend-url";
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
    data?: { order?: NestOrderPayload } | NestOrderPayload;
  };
  const payload = envelope?.data;
  const orderRaw =
    payload && typeof payload === "object" && "order" in payload
      ? payload.order
      : (payload as NestOrderPayload | undefined);

  if (!orderRaw) {
    return jsonMessage("Order not found", 404);
  }

  const body: ApiResponse<{ order: Order }> = {
    data: { order: normalizeNestOrderPayload(orderRaw) },
  };
  return jsonOk(body);
}

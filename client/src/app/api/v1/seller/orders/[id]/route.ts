import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { requireSeller } from "@/lib/require-auth";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { SellerOrder } from "@/modules/seller/orders/types";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import {
  type NestOrderPayload,
  normalizeNestSellerOrderPayload,
} from "@/lib/nest-order-mapper";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

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
    data?:
      | { order?: NestOrderPayload; customerUserId?: string }
      | NestOrderPayload;
  };
  const payload = envelope?.data;
  const orderRaw =
    payload && typeof payload === "object" && "order" in payload
      ? payload.order
      : (payload as NestOrderPayload | undefined);

  if (!orderRaw) {
    return jsonMessage("Order not found", 404);
  }

  const customerUserId =
    payload && typeof payload === "object" && "customerUserId" in payload
      ? String(payload.customerUserId ?? orderRaw.userId)
      : String(orderRaw.userId);

  const body: ApiResponse<{
    order: SellerOrder;
    customerUserId: string;
  }> = {
    data: {
      order: normalizeNestSellerOrderPayload(orderRaw),
      customerUserId,
    },
  };
  return jsonOk(body);
}

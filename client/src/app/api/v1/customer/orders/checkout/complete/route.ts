import { z } from "zod";
import { getBackendUrl } from "@/lib/backend-url";
import type { ApiResponse, Order } from "@/types";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import {
  type NestOrderPayload,
  normalizeNestOrderPayload,
} from "@/lib/nest-order-mapper";
import { requireUser } from "@/lib/require-auth";

const completeSchema = z.object({
  paymentIntentId: z.string().min(1),
});

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return jsonMessage("Invalid JSON body", 400);
  }

  const parsed = completeSchema.safeParse(json);
  if (!parsed.success) {
    return jsonMessage("Invalid completion payload", 422);
  }

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/orders/checkout/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...forwardAuthorization(req),
    },
    body: JSON.stringify(parsed.data),
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
    data?: { orders?: NestOrderPayload[] } | NestOrderPayload;
  };
  const payload = envelope?.data;
  const ordersRaw = Array.isArray(
    payload && typeof payload === "object" && "orders" in payload
      ? payload.orders
      : null,
  )
    ? (payload as { orders: NestOrderPayload[] }).orders
    : payload
      ? [payload as NestOrderPayload]
      : [];

  if (ordersRaw.length === 0) {
    return jsonMessage("Invalid completion response", 500);
  }

  const orders = ordersRaw.map(normalizeNestOrderPayload);
  const body: ApiResponse<{ orders: Order[]; order: Order }> = {
    data: { orders, order: orders[0] },
  };
  return jsonOk(body);
}

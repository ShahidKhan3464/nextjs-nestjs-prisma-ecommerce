import { z } from "zod";
import type { ApiResponse } from "@/types";
import { requireUser } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { CheckoutSession } from "@/modules/buyer/checkout/types";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";

const checkoutSchema = z.object({
  shippingAddress: z.object({
    city: z.string().min(1),
    line1: z.string().min(2),
    region: z.string().min(1),
    country: z.string().min(2),
    fullName: z.string().min(2),
    line2: z.string().optional(),
    phone: z.string().optional(),
    postalCode: z.string().min(1),
  }),
  idempotencyKey: z.string().min(8).max(128).optional(),
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

  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return jsonMessage("Invalid checkout payload", 422);
  }

  const headerKey = req.headers.get("idempotency-key")?.trim();
  const idempotencyKey = parsed.data.idempotencyKey ?? headerKey;

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/orders/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...forwardAuthorization(req),
    },
    body: JSON.stringify({
      shippingAddress: parsed.data.shippingAddress,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    }),
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

  const envelope = raw as { data?: CheckoutSession };
  const data = envelope?.data;
  if (!data?.clientSecret || !data.paymentIntentId) {
    return jsonMessage("Invalid checkout response", 500);
  }

  const session: CheckoutSession = {
    clientSecret: data.clientSecret,
    paymentIntentId: data.paymentIntentId,
    checkoutSessionId: String(data.checkoutSessionId ?? ""),
    orderIds: Array.isArray(data.orderIds) ? data.orderIds.map(String) : [],
    preview: {
      tax: Number(data.preview?.tax ?? 0),
      total: Number(data.preview?.total ?? 0),
      subtotal: Number(data.preview?.subtotal ?? 0),
    },
  };

  const body: ApiResponse<CheckoutSession> = { data: session };
  return jsonOk(body, { status: 201 });
}

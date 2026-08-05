import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { CartItem } from "@/modules/customer/cart/types";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import {
  type NestCartItemPayload,
  normalizeNestCartItemPayload,
} from "@/lib/nest-cart-mapper";
import { requireUser } from "@/lib/require-auth";

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const backend = getBackendUrl();
  const payload = await req.json();

  const res = await fetch(`${backend}/cart/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...forwardAuthorization(req),
    },
    body: JSON.stringify(payload),
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

  const envelope = raw as { data?: unknown };
  const list = Array.isArray(envelope?.data) ? envelope.data : [];
  const items = (list as NestCartItemPayload[]).map(
    normalizeNestCartItemPayload
  );
  const body: ApiResponse<{ items: CartItem[] }> = { data: { items } };
  return jsonOk(body);
}

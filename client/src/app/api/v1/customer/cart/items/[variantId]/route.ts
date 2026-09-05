import type { ApiResponse } from "@/types";
import { requireUser } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { CartItem } from "@/modules/buyer/cart/types";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import {
  type NestCartItemPayload,
  normalizeNestCartItemPayload,
} from "@/lib/nest-cart-mapper";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ variantId: string }> }
) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const { variantId } = await ctx.params;
  const backend = getBackendUrl();
  const payload = await req.json();

  const res = await fetch(
    `${backend}/cart/items/${encodeURIComponent(variantId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...forwardAuthorization(req),
      },
      body: JSON.stringify(payload),
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

  const envelope = raw as { data?: NestCartItemPayload };
  const item = normalizeNestCartItemPayload(
    (envelope?.data ?? raw) as NestCartItemPayload
  );
  const body: ApiResponse<{ item: CartItem }> = { data: { item } };
  return jsonOk(body);
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ variantId: string }> }
) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const { variantId } = await ctx.params;
  const backend = getBackendUrl();

  const res = await fetch(
    `${backend}/cart/items/${encodeURIComponent(variantId)}`,
    {
      method: "DELETE",
      headers: { ...forwardAuthorization(req) },
    }
  );

  if (!res.ok) {
    let raw: unknown = null;
    try {
      raw = await res.json();
    } catch {
      raw = null;
    }
    return jsonMessage(nestErrorMessage(raw), res.status);
  }

  return jsonOk({ data: { removed: true } });
}

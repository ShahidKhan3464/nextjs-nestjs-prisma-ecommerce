import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import { requireUser } from "@/lib/require-auth";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ productId: string }> }
) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const { productId } = await ctx.params;
  const backend = getBackendUrl();

  const res = await fetch(
    `${backend}/wishlist/toggle/${encodeURIComponent(productId)}`,
    {
      method: "POST",
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

  const envelope = raw as {
    data?: { productIds?: unknown[]; added?: boolean };
  };
  const inner = envelope?.data ?? raw;
  const data =
    inner && typeof inner === "object"
      ? (inner as { productIds?: unknown[]; added?: boolean })
      : { productIds: [], added: false };

  const body: ApiResponse<{ productIds: string[]; added: boolean }> = {
    data: {
      productIds: (data.productIds ?? []).map((id) => String(id)),
      added: Boolean(data.added),
    },
  };
  return jsonOk(body);
}

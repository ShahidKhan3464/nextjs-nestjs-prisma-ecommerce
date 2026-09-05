import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { mapNestStore } from "@/lib/nest-store-mapper";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import {
  nestErrorMessage,
  forwardAuthorization,
} from "@/lib/nest-http";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> }
) {
  const { slug } = await ctx.params;
  if (!slug?.trim()) {
    return jsonMessage("Store slug is required", 400);
  }

  const backend = getBackendUrl();
  const res = await fetch(
    `${backend}/stores/slug/${encodeURIComponent(slug.trim())}`,
    { headers: { ...forwardAuthorization(req) } }
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

  const store = mapNestStore(raw);
  if (!store) {
    return jsonMessage("Unexpected store response", 502);
  }

  const body: ApiResponse<{ store: typeof store }> = { data: { store } };
  return jsonOk(body);
}

import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";

function mapProductIds(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((id) => String(id));
}

export async function GET(req: Request) {
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/wishlist`, {
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

  const envelope = raw as { data?: unknown };
  const body: ApiResponse<{ productIds: string[] }> = {
    data: { productIds: mapProductIds(envelope?.data ?? raw) },
  };
  return jsonOk(body);
}

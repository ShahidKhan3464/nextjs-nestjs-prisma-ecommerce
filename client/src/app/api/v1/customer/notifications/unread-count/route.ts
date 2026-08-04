import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";

export async function GET(req: Request) {
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/notifications/unread-count`, {
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

  const payload = unwrapNestDataResponsePayload(raw) as { count?: number };
  const body: ApiResponse<{ count: number }> = {
    data: { count: Number(payload?.count) || 0 },
  };
  return jsonOk(body);
}

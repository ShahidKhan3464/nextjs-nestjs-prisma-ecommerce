import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { requireUser } from "@/lib/require-auth";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";

export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

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

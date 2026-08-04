import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";

export async function PATCH(req: Request) {
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/notifications/read-all`, {
    method: "PATCH",
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

  const payload = unwrapNestDataResponsePayload(raw) as {
    markedCount?: number;
  };
  const body: ApiResponse<{ markedCount: number }> = {
    data: { markedCount: Number(payload?.markedCount) || 0 },
  };
  return jsonOk(body);
}

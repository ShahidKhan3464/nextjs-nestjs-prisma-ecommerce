import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import { requireUser } from "@/lib/require-auth";

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  const backend = getBackendUrl();
  const payload = await req.json();

  const res = await fetch(`${backend}/wishlist/sync`, {
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
  const body: ApiResponse<{ productIds: string[] }> = {
    data: { productIds: list.map((id) => String(id)) },
  };
  return jsonOk(body);
}

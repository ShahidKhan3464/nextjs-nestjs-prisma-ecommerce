import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { requireAdmin } from "@/lib/require-auth";
import { jsonOk, jsonMessage } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteCtx) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const backend = getBackendUrl();
  const res = await fetch(
    `${backend}/products/${encodeURIComponent(id)}/restore`,
    {
      method: "PATCH",
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

  const body: ApiResponse<{ ok: true }> = { data: { ok: true } };
  return jsonOk(body);
}

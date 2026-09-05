import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { requireAdmin } from "@/lib/require-auth";
import { jsonOk, jsonMessage } from "@/lib/api-response";
import {
  nestErrorMessage,
  forwardAuthorization,
} from "@/lib/nest-http";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, ctx: Ctx) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const { id } = await ctx.params;
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/reviews/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { ...forwardAuthorization(req) },
  });

  if (!res.ok) {
    let raw: unknown = null;
    try {
      raw = await res.json();
    } catch {
      raw = null;
    }
    return jsonMessage(nestErrorMessage(raw), res.status);
  }

  const body: ApiResponse<{ deleted: boolean }> = {
    data: { deleted: true },
  };
  return jsonOk(body);
}

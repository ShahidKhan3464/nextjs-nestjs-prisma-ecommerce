import type { ApiResponse } from "@/types";
import { requireAdmin } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { mapNestStore } from "@/lib/nest-store-mapper";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { Store } from "@/modules/seller/store/types";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";

type Props = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Props) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const { id } = await params;
  const backend = getBackendUrl();
  const res = await fetch(`${backend}/stores/${encodeURIComponent(id)}`, {
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

  const store = mapNestStore(raw);
  if (!store) {
    return jsonMessage("Unexpected store response", 502);
  }

  const body: ApiResponse<Store> = { data: store };
  return jsonOk(body);
}

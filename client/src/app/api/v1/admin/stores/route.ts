import type { ApiResponse } from "@/types";
import { requireAdmin } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { mapNestStore } from "@/lib/nest-store-mapper";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import type { Store } from "@/modules/seller/store/types";
import {
  nestErrorMessage,
  forwardAuthorization,
  unwrapNestDataResponsePayload,
} from "@/lib/nest-http";

type NestPagedStores = {
  data?: unknown[];
  page?: number;
  limit?: number;
  total?: number;
};

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const url = new URL(req.url);
  const backend = getBackendUrl();
  const qs = url.searchParams.toString();
  const res = await fetch(`${backend}/stores${qs ? `?${qs}` : ""}`, {
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

  const inner = unwrapNestDataResponsePayload(raw) as NestPagedStores;
  if (!inner || !Array.isArray(inner.data)) {
    return jsonMessage("Unexpected stores response", 502);
  }

  const stores: Store[] = [];
  for (const item of inner.data) {
    const mapped = mapNestStore(item);
    if (mapped) stores.push(mapped);
  }

  const page = inner.page ?? 1;
  const limit = inner.limit ?? 10;
  const total = inner.total ?? stores.length;

  const body: ApiResponse<{
    data: Store[];
    page: number;
    limit: number;
    total: number;
  }> = {
    data: {
      data: stores,
      page,
      limit,
      total,
    },
  };

  return jsonOk(body);
}

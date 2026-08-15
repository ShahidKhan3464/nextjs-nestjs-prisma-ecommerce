import type { ApiResponse } from "@/types";
import { getBackendUrl } from "@/lib/backend-url";
import { requireSeller } from "@/lib/require-auth";
import { jsonOk, jsonMessage } from "@/lib/api-response";
import type { SellerOrder } from "@/modules/seller/orders/types";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import {
  normalizeNestSellerOrderPayload,
  mapNestPagedOrdersEnvelope,
  type OrderPaginationMeta,
} from "@/lib/nest-order-mapper";

function buildQueryString(searchParams: URLSearchParams): string {
  const allowed = ["status", "paymentStatus", "page", "limit"];
  const parts: string[] = [];
  for (const key of allowed) {
    const value = searchParams.get(key);
    if (value) parts.push(`${key}=${encodeURIComponent(value)}`);
  }
  if (!searchParams.get("limit")) {
    parts.push("limit=10");
  }
  if (!searchParams.get("page")) {
    parts.push("page=1");
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

export async function GET(req: Request) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const backend = getBackendUrl();
  const { searchParams } = new URL(req.url);
  const query = buildQueryString(searchParams);
  const res = await fetch(`${backend}/orders/seller${query}`, {
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
  const mapped = mapNestPagedOrdersEnvelope(
    envelope?.data ?? raw,
    normalizeNestSellerOrderPayload
  );

  const body: ApiResponse<{
    orders: SellerOrder[];
    pagination: OrderPaginationMeta;
  }> = {
    data: {
      orders: mapped.orders,
      pagination: mapped.pagination,
    },
  };
  return jsonOk(body);
}

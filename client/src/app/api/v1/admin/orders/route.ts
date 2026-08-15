import type { ApiResponse } from "@/types";
import { requireAdmin } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonOk, jsonMessage } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import type { PaginatedOrdersResult } from "@/modules/buyer/orders/types";
import {
  normalizeNestOrderPayload,
  mapNestPagedOrdersEnvelope,
} from "@/lib/nest-order-mapper";

function buildQueryString(searchParams: URLSearchParams): string {
  const allowed = [
    "status",
    "paymentStatus",
    "userId",
    "storeId",
    "page",
    "limit",
    "dateFrom",
    "dateTo",
  ];
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
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const backend = getBackendUrl();
  const { searchParams } = new URL(req.url);
  const query = buildQueryString(searchParams);
  const res = await fetch(`${backend}/orders/admin/all${query}`, {
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
    normalizeNestOrderPayload
  );

  const body: ApiResponse<PaginatedOrdersResult> = {
    data: {
      orders: mapped.orders,
      pagination: mapped.pagination,
    },
  };
  return jsonOk(body);
}

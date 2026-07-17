import { getBackendUrl } from "@/lib/backend-url";
import type { ApiResponse, Order } from "@/types";
import { jsonMessage, jsonOk } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import {
  type NestOrderPayload,
  normalizeNestOrderPayload,
} from "@/lib/nest-order-mapper";

type NestPagedOrders = {
  data?: NestOrderPayload[];
  page?: number;
  limit?: number;
  total?: number;
};

function mapOrders(raw: unknown): Order[] {
  if (Array.isArray(raw)) {
    return (raw as NestOrderPayload[]).map(normalizeNestOrderPayload);
  }
  const paged = raw as NestPagedOrders | null;
  if (paged && Array.isArray(paged.data)) {
    return paged.data.map(normalizeNestOrderPayload);
  }
  return [];
}

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
  // Existing list UIs are not paginated yet — fetch a wide page by default.
  if (!searchParams.get("limit")) {
    parts.push("limit=100");
  }
  if (!searchParams.get("page")) {
    parts.push("page=1");
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

export async function GET(req: Request) {
  const backend = getBackendUrl();
  const { searchParams } = new URL(req.url);
  const query = buildQueryString(searchParams);
  const res = await fetch(`${backend}/orders${query}`, {
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
  const body: ApiResponse<{ orders: Order[] }> = {
    data: { orders: mapOrders(envelope?.data ?? raw) },
  };
  return jsonOk(body);
}

import { getBackendUrl } from "@/lib/backend-url";
import { requireAdmin } from "@/lib/require-auth";
import type { ApiResponse, Order } from "@/types";
import { jsonOk, jsonMessage } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import {
  type NestOrderPayload,
  normalizeNestOrderPayload,
} from "@/lib/nest-order-mapper";

function mapOrders(raw: unknown): Order[] {
  const list = Array.isArray(raw) ? raw : [];
  return (list as NestOrderPayload[]).map(normalizeNestOrderPayload);
}

function buildQueryString(searchParams: URLSearchParams): string {
  const allowed = ["status", "paymentStatus", "userId", "dateFrom", "dateTo"];
  const parts: string[] = [];
  for (const key of allowed) {
    const value = searchParams.get(key);
    if (value) parts.push(`${key}=${encodeURIComponent(value)}`);
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
  const body: ApiResponse<{ orders: Order[] }> = {
    data: { orders: mapOrders(envelope?.data ?? raw) },
  };
  return jsonOk(body);
}

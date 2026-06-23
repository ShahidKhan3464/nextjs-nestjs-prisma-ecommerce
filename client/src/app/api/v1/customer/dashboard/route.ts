import { requireUser } from "@/lib/require-auth";
import { getBackendUrl } from "@/lib/backend-url";
import { jsonOk, jsonMessage } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import {
  type NestOrderPayload,
  normalizeNestOrderPayload,
} from "@/lib/nest-order-mapper";

type NestCustomerDashboardPayload = {
  totalOrders: number;
  totalSpending: number;
  wishlistCount: number;
  cartItemCount: number;
  recentOrders: NestOrderPayload[];
  ordersByStatus: { status: string; count: number }[];
  spendingByMonth: { month: string; amount: number }[];
};

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/dashboard/customer`, {
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

  const envelope = raw as { data?: NestCustomerDashboardPayload };
  const payload = envelope?.data;

  if (!payload) {
    return jsonMessage("Invalid dashboard response", 502);
  }

  return jsonOk({
    data: {
      ...payload,
      recentOrders: (payload.recentOrders ?? []).map(normalizeNestOrderPayload),
    },
  });
}

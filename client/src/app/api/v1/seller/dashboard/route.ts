import { getBackendUrl } from "@/lib/backend-url";
import { requireSeller } from "@/lib/require-auth";
import { jsonOk, jsonMessage } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import {
  type NestOrderPayload,
  normalizeNestOrderPayload,
} from "@/lib/nest-order-mapper";

type NestSellerDashboardPayload = {
  store: {
    id: number;
    name: string;
    slug: string;
    city: string;
    status: string;
    country: string;
    address: string;
    businessName: string;
    verifiedAt: string | null;
    description: string | null;
  };
  totals: {
    orders: number;
    revenue: number;
    products: number;
    variants: number;
    pendingOrders: number;
    lowStockCount: number;
  };
  recentOrders: NestOrderPayload[];
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  lowStock: { sku: string; product: string; stock: number }[];
  recentActivity: {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }[];
};

export async function GET(req: Request) {
  const seller = await requireSeller(req);
  if (seller instanceof Response) return seller;

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/dashboard/seller`, {
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

  const envelope = raw as { data?: NestSellerDashboardPayload };
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

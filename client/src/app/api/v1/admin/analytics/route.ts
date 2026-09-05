import { getBackendUrl } from "@/lib/backend-url";
import { requireAdmin } from "@/lib/require-auth";
import { jsonOk, jsonMessage } from "@/lib/api-response";
import { nestErrorMessage, forwardAuthorization } from "@/lib/nest-http";
import {
  type NestOrderPayload,
  normalizeNestOrderPayload,
} from "@/lib/nest-order-mapper";

type NestDashboardPayload = {
  totals: {
    orders: number;
    revenue: number;
    products: number;
    variants: number;
    customers: number;
    pendingOrders: number;
    pendingSellerApprovals?: number;
  };
  recentOrders: NestOrderPayload[];
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  lowStock: { sku: string; product: string; stock: number }[];
  recentNotifications?: {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
  }[];
  recentReviews?: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    productName: string;
    productSlug: string;
    buyerName: string;
    createdAt: string;
  }[];
  pendingApprovals?: {
    id: string;
    kind: "seller" | "store";
    name: string;
    status: string;
    createdAt: string;
  }[];
  topProducts?: {
    productId: string;
    name: string;
    slug: string;
    unitsSold: number;
    revenue: number;
    averageRating: number;
    reviewCount: number;
  }[];
  recentCustomers?: {
    id: string;
    fullName: string;
    email: string;
    ordersCount: number;
    lastOrderAt: string;
  }[];
};

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (admin instanceof Response) return admin;

  const backend = getBackendUrl();
  const res = await fetch(`${backend}/dashboard/admin`, {
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

  const envelope = raw as { data?: NestDashboardPayload };
  const payload = envelope?.data;

  if (!payload) {
    return jsonMessage("Invalid dashboard response", 502);
  }

  return jsonOk({
    data: {
      ...payload,
      totals: {
        ...payload.totals,
        pendingSellerApprovals: payload.totals.pendingSellerApprovals ?? 0,
      },
      recentOrders: (payload.recentOrders ?? []).map(normalizeNestOrderPayload),
      recentNotifications: payload.recentNotifications ?? [],
      recentReviews: payload.recentReviews ?? [],
      pendingApprovals: payload.pendingApprovals ?? [],
      topProducts: payload.topProducts ?? [],
      recentCustomers: payload.recentCustomers ?? [],
    },
  });
}

import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import type { Order, OrderListParams, CancelOrderInput } from "../types";

function toQueryParams(params?: OrderListParams) {
  if (!params) return undefined;
  const query: Record<string, string> = {};
  if (params.status) query.status = params.status.toUpperCase();
  if (params.paymentStatus)
    query.paymentStatus = params.paymentStatus.toUpperCase();
  return Object.keys(query).length > 0 ? query : undefined;
}

export async function fetchAdminOrders(params?: OrderListParams) {
  const res = await api.get<ApiResponse<{ orders: Order[] }>>(
    "/api/v1/admin/orders",
    { params: toQueryParams(params) }
  );
  return res.data.data.orders;
}

export async function fetchAdminOrder(id: string) {
  const res = await api.get<
    ApiResponse<{ order: Order; customerUserId: string }>
  >(`/api/v1/admin/orders/${id}`);
  return res.data.data;
}

export async function updateAdminOrderStatus(
  id: string,
  status: "SHIPPED" | "DELIVERED"
) {
  const res = await api.patch<ApiResponse<{ order: Order }>>(
    `/api/v1/admin/orders/${id}/status`,
    { status }
  );
  return res.data.data.order;
}

export async function cancelAdminOrder(id: string, body: CancelOrderInput) {
  const res = await api.post<ApiResponse<{ order: Order }>>(
    `/api/v1/admin/orders/${id}/cancel`,
    body
  );
  return res.data.data.order;
}

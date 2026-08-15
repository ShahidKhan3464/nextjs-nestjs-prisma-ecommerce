import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  Order,
  OrderListParams,
  CancelOrderInput,
  PaginatedOrdersResult,
} from "../types";

function toQueryParams(params?: OrderListParams) {
  if (!params) return undefined;
  const query: Record<string, string> = {};
  if (params.status) query.status = params.status.toUpperCase();
  if (params.paymentStatus)
    query.paymentStatus = params.paymentStatus.toUpperCase();
  if (params.page != null) query.page = String(params.page);
  if (params.limit != null) query.limit = String(params.limit);
  return Object.keys(query).length > 0 ? query : undefined;
}

export async function fetchOrders(params?: OrderListParams) {
  const res = await api.get<ApiResponse<PaginatedOrdersResult>>(
    "/api/v1/customer/orders",
    { params: toQueryParams(params) }
  );
  return res.data.data;
}

export async function fetchOrder(id: string) {
  const res = await api.get<ApiResponse<{ order: Order }>>(
    `/api/v1/customer/orders/${id}`
  );
  return res.data.data.order;
}

export async function cancelOrder(id: string, body: CancelOrderInput) {
  const res = await api.post<ApiResponse<{ order: Order }>>(
    `/api/v1/customer/orders/${id}/cancel`,
    body
  );
  return res.data.data.order;
}

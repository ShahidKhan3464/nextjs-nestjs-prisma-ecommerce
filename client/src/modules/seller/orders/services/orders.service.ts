import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import type {
  SellerOrder,
  SellerOrderListParams,
  UpdateSellerOrderStatus,
} from "../types";

function toQueryParams(params?: SellerOrderListParams) {
  if (!params) return undefined;
  const query: Record<string, string> = {};
  if (params.status) query.status = params.status.toUpperCase();
  if (params.paymentStatus)
    query.paymentStatus = params.paymentStatus.toUpperCase();
  if (params.page != null) query.page = String(params.page);
  if (params.limit != null) query.limit = String(params.limit);
  return Object.keys(query).length > 0 ? query : undefined;
}

export async function fetchSellerOrders(params?: SellerOrderListParams) {
  const res = await api.get<
    ApiResponse<{
      orders: SellerOrder[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>
  >("/api/v1/seller/orders", { params: toQueryParams(params) });
  return res.data.data;
}

export async function fetchSellerOrder(id: string) {
  const res = await api.get<
    ApiResponse<{ order: SellerOrder; customerUserId: string }>
  >(`/api/v1/seller/orders/${id}`);
  return res.data.data;
}

export async function updateSellerOrderStatus(
  id: string,
  status: UpdateSellerOrderStatus
) {
  const res = await api.patch<ApiResponse<{ order: SellerOrder }>>(
    `/api/v1/seller/orders/${id}/status`,
    { status }
  );
  return res.data.data.order;
}

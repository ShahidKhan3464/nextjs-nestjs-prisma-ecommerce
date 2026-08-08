import { api } from "@/services/api/client";
import type {
  Payment,
  PaymentListParams,
  PaymentListResult,
  RecordRefundInput,
} from "../types";

function buildQuery(params?: PaymentListParams) {
  const query: Record<string, string | number | boolean> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
  };
  if (params?.status) query.status = params.status;
  if (params?.provider) query.provider = params.provider;
  if (params?.orderId) query.orderId = params.orderId;
  if (params?.userId) query.userId = params.userId;
  if (params?.storeId) query.storeId = params.storeId;
  if (params?.transactionId) query.transactionId = params.transactionId;
  if (params?.hasFailure != null) query.hasFailure = params.hasFailure;
  if (params?.hasRefund != null) query.hasRefund = params.hasRefund;
  return query;
}

export async function fetchAdminPayments(
  params?: PaymentListParams
): Promise<PaymentListResult> {
  const res = await api.get<{
    data: {
      data: Payment[];
      page: number;
      limit: number;
      total: number;
    };
  }>("/api/v1/admin/payments", { params: buildQuery(params) });

  const rawData = res.data.data;
  return {
    data: rawData.data,
    meta: {
      currentPage: rawData.page,
      itemsPerPage: rawData.limit,
      totalItems: rawData.total,
      totalPages: Math.max(1, Math.ceil(rawData.total / rawData.limit)),
    },
  };
}

export async function fetchAdminPayment(id: string | number) {
  const res = await api.get<{ data: Payment }>(
    `/api/v1/admin/payments/${id}`
  );
  return res.data.data;
}

export async function refundAdminPayment(
  id: string | number,
  input: RecordRefundInput
) {
  const res = await api.post<{ data: Payment }>(
    `/api/v1/admin/payments/${id}/refunds`,
    input
  );
  return res.data.data;
}

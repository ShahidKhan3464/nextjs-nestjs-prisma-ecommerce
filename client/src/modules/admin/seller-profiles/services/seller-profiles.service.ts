import { api } from "@/services/api/client";
import type {
  SellerProfile,
  SellerProfileStatus,
  RejectSellerProfileInput,
  ApproveSellerProfileInput,
  SuspendSellerProfileInput,
} from "../types";

export async function fetchAdminSellerProfiles(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: SellerProfileStatus;
}) {
  const query: Record<string, string | number> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
  };
  if (params?.search) query.search = params.search;
  if (params?.status) query.status = params.status;

  const res = await api.get<{
    data: {
      data: SellerProfile[];
      page: number;
      limit: number;
      total: number;
    };
  }>("/api/v1/admin/seller-profiles", { params: query });

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

export async function fetchAdminSellerProfile(id: string | number) {
  const res = await api.get<{ data: SellerProfile }>(
    `/api/v1/admin/seller-profiles/${id}`
  );
  return res.data.data;
}

export async function approveAdminSellerProfile(
  id: string | number,
  input: ApproveSellerProfileInput
) {
  const res = await api.patch<{ data: SellerProfile }>(
    `/api/v1/admin/seller-profiles/${id}/approve`,
    input
  );
  return res.data.data;
}

export async function rejectAdminSellerProfile(
  id: string | number,
  input: RejectSellerProfileInput
) {
  const res = await api.patch<{ data: SellerProfile }>(
    `/api/v1/admin/seller-profiles/${id}/reject`,
    input
  );
  return res.data.data;
}

export async function suspendAdminSellerProfile(
  id: string | number,
  input?: SuspendSellerProfileInput
) {
  const res = await api.patch<{ data: SellerProfile }>(
    `/api/v1/admin/seller-profiles/${id}/suspend`,
    input ?? {}
  );
  return res.data.data;
}

import { api } from "@/services/api/client";
import type {
  Store,
  SuspendStoreInput,
  AdminStoreListParams,
  AdminStoreListResult,
} from "../types";

export async function fetchAdminStores(
  params?: AdminStoreListParams
): Promise<AdminStoreListResult> {
  const query: Record<string, string | number> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
  };
  if (params?.search) query.search = params.search;
  if (params?.status) query.status = params.status;

  const res = await api.get<{
    data: {
      data: Store[];
      page: number;
      limit: number;
      total: number;
    };
  }>("/api/v1/admin/stores", { params: query });

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

export async function fetchAdminStore(id: string | number) {
  const res = await api.get<{ data: Store }>(`/api/v1/admin/stores/${id}`);
  return res.data.data;
}

export async function suspendAdminStore(
  id: string | number,
  input?: SuspendStoreInput
) {
  const res = await api.patch<{ data: Store }>(
    `/api/v1/admin/stores/${id}/suspend`,
    input ?? {}
  );
  return res.data.data;
}

export async function unsuspendAdminStore(id: string | number) {
  const res = await api.patch<{ data: Store }>(
    `/api/v1/admin/stores/${id}/unsuspend`,
    {}
  );
  return res.data.data;
}

export async function verifyAdminStore(id: string | number) {
  const res = await api.patch<{ data: Store }>(
    `/api/v1/admin/stores/${id}/verify`,
    {}
  );
  return res.data.data;
}

export async function unverifyAdminStore(id: string | number) {
  const res = await api.patch<{ data: Store }>(
    `/api/v1/admin/stores/${id}/unverify`,
    {}
  );
  return res.data.data;
}

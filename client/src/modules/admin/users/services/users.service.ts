import { api } from "@/services/api/client";
import type { User, AdminUserDetail } from "../types";

export async function fetchAdminUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  isBlocked?: boolean;
}) {
  const query: Record<string, string | number> = {
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
  };
  if (params?.search) query.search = params.search;
  if (params?.isBlocked === true) query.isBlocked = "true";
  if (params?.isBlocked === false) query.isBlocked = "false";

  const res = await api.get<{
    data: {
      data: User[];
      page: number;
      limit: number;
      total: number;
    };
  }>("/api/v1/admin/users", { params: query });

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

export async function fetchAdminUserDetail(id: string | number) {
  const res = await api.get<{ data: AdminUserDetail }>(
    `/api/v1/admin/users/${id}/detail`
  );
  return res.data.data;
}

export async function blockAdminUser(id: string | number, isBlocked: boolean) {
  const res = await api.patch<{ data: User }>(
    `/api/v1/admin/users/${id}/block`,
    {
      isBlocked,
    }
  );
  return res.data.data;
}

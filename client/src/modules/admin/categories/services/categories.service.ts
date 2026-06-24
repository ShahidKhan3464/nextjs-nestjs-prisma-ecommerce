import { api } from "@/services/api/client";
import type { AdminCategoryOption, CreateCategoryInput } from "../types";

export async function createAdminCategory(payload: CreateCategoryInput) {
  const res = await api.post<{ data: { category: AdminCategoryOption } }>(
    "/api/v1/admin/categories",
    payload
  );
  return res.data.data.category;
}

export async function updateAdminCategory(
  id: number,
  payload: CreateCategoryInput
) {
  const res = await api.patch<{ data: { category: AdminCategoryOption } }>(
    `/api/v1/admin/categories/${id}`,
    payload
  );
  return res.data.data.category;
}

export async function deleteAdminCategory(id: number) {
  await api.delete(`/api/v1/admin/categories/${id}`);
}

export async function fetchAdminCategory(id: number) {
  const res = await api.get<{ data: { category: AdminCategoryOption } }>(
    `/api/v1/admin/categories/${id}`
  );
  return res.data.data.category;
}

export async function fetchAdminCategories(params?: {
  limit?: number;
  page?: number;
  search?: string;
  lifeCycle?: "active" | "removed" | "all";
}) {
  const res = await api.get<{
    data: {
      categories: AdminCategoryOption[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }>("/api/v1/admin/categories", {
    params: {
      limit: params?.limit ?? 10,
      page: params?.page ?? 1,
      ...(params?.search ? { search: params.search } : {}),
      ...(params?.lifeCycle ? { lifeCycle: params.lifeCycle } : {}),
    },
  });
  return res.data.data;
}

export async function restoreAdminCategory(id: number) {
  await api.patch(`/api/v1/admin/categories/${id}/restore`);
}

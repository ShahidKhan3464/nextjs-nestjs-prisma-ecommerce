import { api } from "@/services/api/client";
import type { Product } from "@/modules/customer/products/types";
import type {
  CreateAdminProductInput,
  UpdateAdminProductInput,
} from "../types";

export async function fetchAdminProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  lifeCycle?: "active" | "removed" | "all";
}) {
  const res = await api.get<{
    data: {
      products: Product[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    };
  }>("/api/v1/admin/products", { params });
  return res.data.data;
}

export async function createAdminProduct(payload: CreateAdminProductInput) {
  const fd = new FormData();
  fd.append("categoryId", String(payload.categoryId));
  fd.append("name", payload.name);
  if (payload.description?.trim()) {
    fd.append("description", payload.description.trim());
  }
  fd.append("variants", JSON.stringify(payload.variants));
  for (const file of payload.images) {
    fd.append("images", file);
  }
  await api.post("/api/v1/admin/products", fd);
}

export async function fetchAdminProduct(id: number | string) {
  const res = await api.get<{ data: Product }>(`/api/v1/admin/products/${id}`);
  return res.data.data;
}

export async function updateAdminProduct(
  id: number | string,
  payload: UpdateAdminProductInput
) {
  const fd = new FormData();
  if (payload.categoryId !== undefined) {
    fd.append("categoryId", String(payload.categoryId));
  }
  if (payload.name !== undefined) fd.append("name", payload.name);
  if (payload.description !== undefined) {
    fd.append("description", payload.description);
  }
  if (payload.variants !== undefined) {
    fd.append("variants", JSON.stringify(payload.variants));
  }
  if (payload.retainImagePaths !== undefined) {
    fd.append("retainImagePaths", JSON.stringify(payload.retainImagePaths));
  }
  for (const file of payload.newImages ?? []) {
    fd.append("images", file);
  }
  await api.patch(`/api/v1/admin/products/${id}`, fd);
}

export async function deleteAdminProduct(id: string) {
  await api.delete(`/api/v1/admin/products/${id}`);
}

export async function restoreAdminProduct(id: string) {
  await api.patch(`/api/v1/admin/products/${id}/restore`);
}

import { api } from "@/services/api/client";
import type {
  SellerProduct,
  CreateSellerProductInput,
  SellerProductListParams,
  SellerProductListResult,
  UpdateSellerProductInput,
} from "../types";

export async function fetchSellerProducts(
  params?: SellerProductListParams
): Promise<SellerProductListResult> {
  const res = await api.get<{ data: SellerProductListResult }>(
    "/api/v1/seller/products",
    { params }
  );
  return res.data.data;
}

export async function fetchSellerProduct(
  id: number | string
): Promise<SellerProduct> {
  const res = await api.get<{ data: { product: SellerProduct } }>(
    `/api/v1/seller/products/${id}`
  );
  return res.data.data.product;
}

export async function createSellerProduct(
  payload: CreateSellerProductInput
): Promise<SellerProduct> {
  const fd = new FormData();
  fd.append("categoryId", String(payload.categoryId));
  fd.append("name", payload.name);
  if (payload.description?.trim()) {
    fd.append("description", payload.description.trim());
  }
  if (payload.status) {
    fd.append("status", payload.status);
  }
  fd.append("variants", JSON.stringify(payload.variants));
  for (const file of payload.images) {
    fd.append("images", file);
  }
  const res = await api.post<{ data: { product: SellerProduct } }>(
    "/api/v1/seller/products",
    fd
  );
  return res.data.data.product;
}

export async function updateSellerProduct(
  id: number | string,
  payload: UpdateSellerProductInput
): Promise<SellerProduct | null> {
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
  const res = await api.patch<{ data: { product?: SellerProduct } }>(
    `/api/v1/seller/products/${id}`,
    fd
  );
  return res.data.data.product ?? null;
}

export async function deleteSellerProduct(id: string): Promise<void> {
  await api.delete(`/api/v1/seller/products/${id}`);
}

export async function publishSellerProduct(id: string): Promise<SellerProduct | null> {
  const res = await api.patch<{ data: { product?: SellerProduct } }>(
    `/api/v1/seller/products/${id}/publish`
  );
  return res.data.data.product ?? null;
}

export async function archiveSellerProduct(id: string): Promise<SellerProduct | null> {
  const res = await api.patch<{ data: { product?: SellerProduct } }>(
    `/api/v1/seller/products/${id}/archive`
  );
  return res.data.data.product ?? null;
}

export async function restoreSellerProduct(id: string): Promise<SellerProduct | null> {
  const res = await api.patch<{ data: { product?: SellerProduct } }>(
    `/api/v1/seller/products/${id}/restore`
  );
  return res.data.data.product ?? null;
}

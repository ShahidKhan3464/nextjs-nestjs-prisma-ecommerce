import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import type { Store, StoreFileType, UpdateStoreInput } from "../types";

export async function fetchMyStore(): Promise<Store> {
  const res = await api.get<ApiResponse<{ store: Store }>>(
    "/api/v1/seller/store/me"
  );
  return res.data.data.store;
}

export async function updateMyStore(body: UpdateStoreInput): Promise<Store> {
  const res = await api.patch<ApiResponse<{ store: Store }>>(
    "/api/v1/seller/store/me",
    body
  );
  return res.data.data.store;
}

export async function uploadStoreFile(
  file: File,
  type: StoreFileType
): Promise<Store> {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);
  const res = await api.post<ApiResponse<{ store: Store }>>(
    "/api/v1/seller/store/me/files",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data.store;
}

export async function removeStoreFile(type: StoreFileType): Promise<Store> {
  const res = await api.delete<ApiResponse<{ store: Store }>>(
    `/api/v1/seller/store/me/files/${type}`
  );
  return res.data.data.store;
}

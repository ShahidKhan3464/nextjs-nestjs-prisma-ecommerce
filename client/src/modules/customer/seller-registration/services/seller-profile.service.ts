import { isAxiosError } from "axios";
import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import { useAuthStore } from "@/store/auth-store";
import { fetchProfile } from "@/modules/customer/profile/services/profile.service";
import type {
  SellerProfile,
  SellerDocumentType,
  CreateSellerProfileInput,
  UpdateSellerProfileInput,
} from "../types";

export async function fetchMySellerProfile(): Promise<SellerProfile | null> {
  try {
    const res = await api.get<ApiResponse<{ profile: SellerProfile }>>(
      "/api/v1/customer/seller-profile/me"
    );
    return res.data.data.profile;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createSellerProfile(
  body: CreateSellerProfileInput
): Promise<SellerProfile> {
  const res = await api.post<ApiResponse<{ profile: SellerProfile }>>(
    "/api/v1/customer/seller-profile",
    body
  );
  return res.data.data.profile;
}

export async function updateSellerProfile(
  body: UpdateSellerProfileInput
): Promise<SellerProfile> {
  const res = await api.patch<ApiResponse<{ profile: SellerProfile }>>(
    "/api/v1/customer/seller-profile/me",
    body
  );
  return res.data.data.profile;
}

export async function uploadSellerDocument(
  file: File,
  type: SellerDocumentType
): Promise<SellerProfile> {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);
  const res = await api.post<ApiResponse<{ profile: SellerProfile }>>(
    "/api/v1/customer/seller-profile/me/documents",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data.data.profile;
}

/** Refresh Nest/session tokens and hydrate auth store with current roles. */
export async function refreshSellerSession() {
  const res = await api.post<
    ApiResponse<{ accessToken: string; expiresIn: number }>
  >("/api/v1/auth/refresh", {});
  const { accessToken, expiresIn } = res.data.data;
  useAuthStore.getState().setAccessToken(accessToken, expiresIn);
  const user = await fetchProfile();
  useAuthStore.getState().setUser(user);
  return user;
}

import type { User } from "../types";
import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import { resolveUploadUrl } from "@/lib/resolve-upload-url";

let profileFetchInFlight: Promise<User> | null = null;

export async function fetchProfile() {
  if (!profileFetchInFlight) {
    profileFetchInFlight = api
      .get<ApiResponse<{ user: User }>>("/api/v1/customer/profile/me")
      .then((res) => res.data.data.user)
      .finally(() => {
        profileFetchInFlight = null;
      });
  }
  return profileFetchInFlight;
}

export async function updateProfile(body: {
  fullName: string;
  phoneNumber?: string;
}) {
  const res = await api.patch<ApiResponse<{ user: User }>>(
    "/api/v1/customer/profile/me",
    body
  );
  return res.data.data.user;
}

export async function uploadProfileAvatar(file: File) {
  const form = new FormData();
  form.append("avatar", file);
  const res = await api.post<ApiResponse<{ avatarUrl: string }>>(
    "/api/v1/customer/profile/me/avatar",
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return resolveUploadUrl(res.data.data.avatarUrl) ?? res.data.data.avatarUrl;
}

export async function changePassword(body: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  await api.patch("/api/v1/customer/profile/me/password", body);
}

import type { User } from "../types";
import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";

export async function loginRequest(email: string, password: string) {
  const res = await api.post<
    ApiResponse<{
      user: User;
      expiresIn: number;
      accessToken: string;
    }>
  >("/api/v1/auth/login", { email, password });
  return res.data.data;
}

export async function registerRequest(body: {
  fullName: string;
  phoneNumber?: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const res = await api.post<ApiResponse<{ user: User }>>(
    "/api/v1/auth/register",
    body
  );
  return res.data.data;
}

export async function forgotPasswordRequest(email: string) {
  const res = await api.post<ApiResponse<{ sent: boolean }>>(
    "/api/v1/auth/forgot-password",
    { email }
  );
  return res.data.data;
}

export async function resetPasswordRequest(body: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  const res = await api.post<ApiResponse<{ reset: true }>>(
    "/api/v1/auth/reset-password",
    body
  );
  return res.data.data;
}

export async function logoutRequest() {
  await api.post<ApiResponse<{ ok: true }>>("/api/v1/auth/logout");
}

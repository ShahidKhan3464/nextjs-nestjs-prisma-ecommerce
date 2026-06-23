import { getSiteUrl } from "@/lib/backend-url";
import { useAuthStore, isTokenExpired } from "@/store/auth-store";
import { handlePossibleBlockedApiError } from "@/lib/account-blocked";
import { resetCartWishlistSession } from "@/lib/cart-wishlist-session";
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

/** Browser: same-origin `/api/v1/*` (Route Handlers → Nest). Server: absolute URL to this Next app so paths resolve correctly. */
const base = typeof window !== "undefined" ? "" : getSiteUrl();

export const api = axios.create({
  withCredentials: true,
  baseURL: base || undefined,
  headers: { "Content-Type": "application/json" },
});

/** Shared promise so concurrent requests don't trigger multiple refresh calls. */
let refreshPromise: Promise<string> | null = null;

/**
 * Calls the Next Route Handler, which reads the httpOnly Nest refresh cookie and
 * forwards `{ refreshToken }` to the Nest API. Response returns a new Nest access
 * token (same role as `backend_access_token`); Zustand stores it for `Authorization`.
 */
async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = axios
    .post<{ data: { accessToken: string; expiresIn: number } }>(
      `${base}/api/v1/auth/refresh`,
      {},
      { withCredentials: true }
    )
    .then((res) => {
      const { accessToken, expiresIn } = res.data.data;
      useAuthStore.getState().setAccessToken(accessToken, expiresIn);
      return accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().accessToken;

  // Skip auth endpoints — they don't need a token and must not trigger refresh
  const url = config.url ?? "";
  const isAuthEndpoint =
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/forgot-password") ||
    url.includes("/auth/reset-password");

  if (!isAuthEndpoint && token && isTokenExpired()) {
    try {
      const fresh = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${fresh}`;
    } catch (refreshError) {
      if (!handlePossibleBlockedApiError(refreshError)) {
        useAuthStore.getState().clearSession();
        resetCartWishlistSession();
      }
    }
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig | undefined;

    if (
      !original ||
      original.url?.includes("/auth/refresh") ||
      original.url?.includes("/auth/login") ||
      original.url?.includes("/auth/reset-password")
    ) {
      return Promise.reject(error);
    }

    if (handlePossibleBlockedApiError(error)) {
      return Promise.reject(error);
    }

    // Only retry once on 401 (token may have expired between request interceptor and server response)
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const fresh = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${fresh}`;
      return api(original);
    } catch (refreshError) {
      if (!handlePossibleBlockedApiError(refreshError)) {
        useAuthStore.getState().clearSession();
        resetCartWishlistSession();
      }
      return Promise.reject(error);
    }
  }
);

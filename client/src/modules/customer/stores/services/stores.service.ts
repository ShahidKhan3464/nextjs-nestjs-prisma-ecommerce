import { api } from "@/services/api/client";
import { getSiteUrl } from "@/lib/backend-url";
import type { ApiResponse } from "@/types/api";
import type { Store } from "@/modules/seller/store/types";

async function fetchStoreBySlugOnServer(slug: string): Promise<Store> {
  const { cookies } = await import("next/headers");
  const { AUTH_BACKEND_ACCESS_COOKIE } = await import("@/lib/auth-cookies");

  const jar = await cookies();
  const backendToken = jar.get(AUTH_BACKEND_ACCESS_COOKIE)?.value;

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (backendToken) {
    headers.Authorization = `Bearer ${backendToken}`;
  }

  const res = await fetch(
    `${getSiteUrl()}/api/v1/customer/stores/${encodeURIComponent(slug)}`,
    { headers, next: { revalidate: 60 } }
  );

  if (!res.ok) {
    throw new Error(`Failed to load store (${res.status})`);
  }

  const body = (await res.json()) as ApiResponse<{ store: Store }>;
  return body.data.store;
}

export async function fetchStoreBySlug(slug: string): Promise<Store> {
  if (typeof window === "undefined") {
    return fetchStoreBySlugOnServer(slug);
  }

  const res = await api.get<ApiResponse<{ store: Store }>>(
    `/api/v1/customer/stores/${encodeURIComponent(slug)}`
  );
  return res.data.data.store;
}

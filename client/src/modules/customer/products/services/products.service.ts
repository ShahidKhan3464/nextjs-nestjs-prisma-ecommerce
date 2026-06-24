import { api } from "@/services/api/client";
import { getSiteUrl } from "@/lib/backend-url";
import type { Product, ProductListParams } from "../types";
import type { ApiResponse, PaginatedResponse } from "@/types/api";

export async function fetchProducts(params: ProductListParams) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });

  const res = await api.get<PaginatedResponse<Product>>(
    `/api/v1/customer/products?${search.toString()}`
  );
  return res.data;
}

/** Server components cannot use the browser axios client (no cookies / Zustand token). */
async function fetchProductBySlugOnServer(slug: string): Promise<Product> {
  const { cookies } = await import("next/headers");
  const { AUTH_BACKEND_ACCESS_COOKIE } = await import("@/lib/auth-cookies");

  const jar = await cookies();
  const backendToken = jar.get(AUTH_BACKEND_ACCESS_COOKIE)?.value;

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (backendToken) {
    headers.Authorization = `Bearer ${backendToken}`;
  }

  const res = await fetch(
    `${getSiteUrl()}/api/v1/customer/products/${encodeURIComponent(slug)}`,
    { headers, next: { revalidate: 60 } }
  );

  if (!res.ok) {
    throw new Error(`Failed to load product (${res.status})`);
  }

  const body = (await res.json()) as ApiResponse<Product>;
  return body.data;
}

export async function fetchProductBySlug(slug: string) {
  if (typeof window === "undefined") {
    return fetchProductBySlugOnServer(slug);
  }

  const res = await api.get<ApiResponse<Product>>(
    `/api/v1/customer/products/${encodeURIComponent(slug)}`
  );
  return res.data.data;
}

import type { ApiResponse } from "@/types";
import { api } from "@/services/api/client";
import type { WishlistPayload } from "../types";

export async function fetchWishlist(): Promise<WishlistPayload> {
  const res = await api.get<ApiResponse<WishlistPayload>>(
    "/api/v1/customer/wishlist"
  );
  return res.data.data;
}

export async function toggleWishlistItem(productId: string) {
  const res = await api.post<
    ApiResponse<{ productIds: string[]; added: boolean }>
  >(`/api/v1/customer/wishlist/toggle/${encodeURIComponent(productId)}`);
  return res.data.data;
}

export async function syncWishlist(productIds: string[]) {
  const res = await api.post<ApiResponse<{ productIds: string[] }>>(
    "/api/v1/customer/wishlist/sync",
    {
      productIds: productIds.map((id) => Number(id)),
    }
  );
  return res.data.data.productIds;
}

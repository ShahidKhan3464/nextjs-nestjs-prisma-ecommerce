import type { CartItem } from "../types";
import type { ApiResponse } from "@/types";
import { api } from "@/services/api/client";

export async function fetchCart() {
  const res = await api.get<ApiResponse<{ items: CartItem[] }>>(
    "/api/v1/customer/cart"
  );
  return res.data.data.items;
}

export async function addCartItem(variantId: string, quantity: number) {
  const res = await api.post<ApiResponse<{ item: CartItem }>>(
    "/api/v1/customer/cart",
    { variantId: Number(variantId), quantity }
  );
  return res.data.data.item;
}

export async function updateCartItem(variantId: string, quantity: number) {
  const res = await api.patch<ApiResponse<{ item: CartItem }>>(
    `/api/v1/customer/cart/items/${encodeURIComponent(variantId)}`,
    { quantity }
  );
  return res.data.data.item;
}

export async function removeCartItem(variantId: string) {
  await api.delete(
    `/api/v1/customer/cart/items/${encodeURIComponent(variantId)}`
  );
}

export async function clearCartRemote() {
  await api.delete("/api/v1/customer/cart");
}

export async function syncCart(
  items: { variantId: string; quantity: number }[]
) {
  const res = await api.post<ApiResponse<{ items: CartItem[] }>>(
    "/api/v1/customer/cart/sync",
    {
      items: items.map((i) => ({
        variantId: Number(i.variantId),
        quantity: i.quantity,
      })),
    }
  );
  return res.data.data.items;
}

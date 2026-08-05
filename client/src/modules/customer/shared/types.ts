import type { CartItem, CartItemStore } from "@/modules/customer/cart/types";

export type StoreCartGroup = {
  storeKey: string;
  subtotal: number;
  items: CartItem[];
  store: CartItemStore | null;
};

export type GroupedCart = {
  itemCount: number;
  grandTotal: number;
  groups: StoreCartGroup[];
};

export type StoreLike = Pick<
  CartItemStore,
  "name" | "slug" | "verified" | "logoUrl" | "sellerName"
>;

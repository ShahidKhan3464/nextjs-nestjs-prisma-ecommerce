import { getBackendUrl } from "@/lib/backend-url";
import type { CartItem, CartItemStore } from "@/modules/buyer/cart/types";

type NestCartItemStorePayload = {
  id: string | number;
  name: string;
  slug: string;
  verified: boolean;
  logoUrl?: string | null;
  sellerName: string;
};

export type NestCartItemPayload = {
  id: number;
  slug: string;
  name: string;
  price: number;
  image: string;
  maxQty: number;
  quantity: number;
  variantLabel: string;
  productId: string | number;
  variantId: string | number;
  store?: NestCartItemStorePayload | null;
};

function normalizeImage(image?: string | null): string {
  if (!image) return "/placeholder.svg";
  const backend = getBackendUrl();
  return image.startsWith("/") ? `${backend}${image}` : image;
}

function normalizeStore(
  store?: NestCartItemStorePayload | null
): CartItemStore | null {
  if (!store) return null;
  return {
    id: String(store.id),
    name: store.name,
    slug: store.slug,
    verified: Boolean(store.verified),
    logoUrl: store.logoUrl ? normalizeImage(store.logoUrl) : null,
    sellerName: store.sellerName,
  };
}

export function normalizeNestCartItemPayload(
  item: NestCartItemPayload
): CartItem {
  return {
    slug: item.slug,
    name: item.name,
    maxQty: item.maxQty,
    quantity: item.quantity,
    price: Number(item.price),
    image: normalizeImage(item.image),
    variantLabel: item.variantLabel,
    productId: String(item.productId),
    variantId: String(item.variantId),
    store: normalizeStore(item.store),
  };
}

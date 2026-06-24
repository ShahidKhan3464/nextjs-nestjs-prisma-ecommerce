import { getBackendUrl } from "@/lib/backend-url";
import type { CartItem } from "@/modules/customer/cart/types";

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
};

export function normalizeNestCartItemPayload(
  item: NestCartItemPayload
): CartItem {
  const backend = getBackendUrl();
  const image =
    item.image && item.image.startsWith("/")
      ? `${backend}${item.image}`
      : item.image || "/placeholder.svg";

  return {
    image,
    slug: item.slug,
    name: item.name,
    maxQty: item.maxQty,
    quantity: item.quantity,
    price: Number(item.price),
    variantLabel: item.variantLabel,
    productId: String(item.productId),
    variantId: String(item.variantId),
  };
}

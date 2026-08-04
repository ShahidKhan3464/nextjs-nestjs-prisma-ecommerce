import {
  CartItemWithRelations,
  ProductVariantWithRelations,
} from 'src/common/types/domain.types';

export type CartItemStoreResponse = {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  sellerName: string;
  logoUrl: string | null;
};

export type CartItemResponse = {
  id: number;
  slug: string;
  name: string;
  price: number;
  image: string;
  maxQty: number;
  quantity: number;
  variantId: string;
  productId: string;
  variantLabel: string;
  store: CartItemStoreResponse | null;
};

function formatVariantLabel(variant: ProductVariantWithRelations): string {
  const parts = [variant.size, variant.color].filter(
    (p) => typeof p === 'string' && p.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(' / ') : variant.sku;
}

export function mapCartItemToResponse(
  item: CartItemWithRelations,
): CartItemResponse {
  const variant = item.variant;
  const product = variant.product;
  const image =
    product.images?.[0]?.urlPath ??
    (product.images?.length ? product.images[0].urlPath : '');

  const store = product.store
    ? {
        id: String(product.store.id),
        name: product.store.name,
        slug: product.store.slug,
        logoUrl: product.store.logoUrl ?? null,
        verified: Boolean(product.store.verifiedAt),
        sellerName:
          product.store.sellerProfile?.businessName ?? product.store.name,
      }
    : null;

  return {
    image,
    store,
    id: item.id,
    name: product.name,
    quantity: item.quantity,
    price: Number(variant.price),
    maxQty: variant.stockQuantity,
    variantId: String(variant.id),
    productId: String(product.id),
    slug: product.slug ?? String(product.id),
    variantLabel: formatVariantLabel(variant),
  };
}

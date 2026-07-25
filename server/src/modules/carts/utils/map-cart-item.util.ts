import {
  CartItemWithRelations,
  ProductVariantWithRelations,
} from 'src/common/types/domain.types';

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

  return {
    image,
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

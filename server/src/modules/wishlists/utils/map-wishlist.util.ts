import { LOW_STOCK_THRESHOLD } from '../constants/wishlist.constants';
import type {
  WishlistAvailability,
  WishlistProductSource,
  WishlistProductSummary,
} from '../types/wishlist.types';

export function mapWishlistProductToSummary(
  product: WishlistProductSource,
): WishlistProductSummary {
  const totalStock = (product.variants ?? []).reduce(
    (sum, v) => sum + (v.stockQuantity ?? 0),
    0,
  );
  let availability: WishlistAvailability = 'in_stock';
  if (totalStock <= 0) availability = 'out_of_stock';
  else if (totalStock <= LOW_STOCK_THRESHOLD) availability = 'low_stock';

  const galleryFallback = product.files?.[0]?.file?.urlPath ?? null;

  return {
    id: String(product.id),
    name: product.name,
    slug: product.slug ?? String(product.id),
    image: galleryFallback,
    basePrice: Number(product.basePrice),
    availability,
    totalStock,
    store: product.store
      ? {
          id: String(product.store.id),
          name: product.store.name,
          slug: product.store.slug,
          verified: Boolean(product.store.verifiedAt),
          logoUrl: product.store.files?.[0]?.file?.urlPath ?? null,
          sellerName:
            product.store.sellerProfile?.businessName ?? product.store.name,
        }
      : null,
  };
}

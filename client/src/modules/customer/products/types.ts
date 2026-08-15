export type BuyerCategoryOption = {
  id: number;
  name: string;
  description: string | null;
};

export const PRODUCT_SORT_OPTIONS = [
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "name_asc",
  "rating_desc",
] as const;

export type ProductSort = (typeof PRODUCT_SORT_OPTIONS)[number];

export type ProductListParams = {
  q?: string;
  page?: number;
  limit?: number;
  storeId?: number;
  sellerId?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sort?: ProductSort;
  categoryId?: number;
};

export type ProductStoreSeller = {
  id: number;
  status: string;
  businessName: string;
};

export type ProductStore = {
  id: string;
  name: string;
  slug: string;
  status: string;
  verified: boolean;
  logoUrl: string | null;
  seller?: ProductStoreSeller;
};

export type ProductVariant = {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
  productId: string;
  compareAtPrice?: number;
  options?: {
    size?: string;
    color?: string;
  };
};

export type ProductBadgeKind = "new" | "low_stock" | "out_of_stock";

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryId?: number;
  images: string[];
  basePrice: number;
  description: string;
  isRemoved?: boolean;
  store?: ProductStore;
  publishedAt?: string | null;
  variants: ProductVariant[];
  averageRating?: number;
  reviewCount?: number;
};

export function isProductSort(value: string): value is ProductSort {
  return (PRODUCT_SORT_OPTIONS as readonly string[]).includes(value);
}

export function getProductBadges(product: Product): ProductBadgeKind[] {
  const badges: ProductBadgeKind[] = [];
  const totalStock = product.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);

  if (totalStock <= 0) {
    badges.push("out_of_stock");
  } else if (totalStock <= 5) {
    badges.push("low_stock");
  }

  const publishedAt = product.publishedAt
    ? new Date(product.publishedAt).getTime()
    : NaN;
  if (
    Number.isFinite(publishedAt) &&
    Date.now() - publishedAt <= 14 * 24 * 60 * 60 * 1000
  ) {
    badges.push("new");
  }

  return badges;
}

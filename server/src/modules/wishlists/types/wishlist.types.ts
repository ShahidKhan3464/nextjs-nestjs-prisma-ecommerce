export type WishlistAvailability = 'in_stock' | 'low_stock' | 'out_of_stock';

export type WishlistProductStore = {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  sellerName: string;
  logoUrl: string | null;
};

export type WishlistProductSummary = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  totalStock: number;
  image: string | null;
  store: WishlistProductStore | null;
  availability: WishlistAvailability;
};

export type WishlistResponse = {
  productIds: string[];
  items: WishlistProductSummary[];
};

/** Prisma product shape used by wishlist mapping. */
export type WishlistProductSource = {
  id: number;
  name: string;
  slug: string | null;
  variants?: Array<{ stockQuantity: number | null }>;
  basePrice: { toNumber?: () => number } | number | string;
  files?: Array<{ file: { urlPath: string } | null } | null>;
  store?: {
    id: number;
    name: string;
    slug: string;
    verifiedAt: Date | null;
    sellerProfile?: { businessName: string } | null;
    files?: Array<{ file: { urlPath: string } | null } | null>;
  } | null;
};

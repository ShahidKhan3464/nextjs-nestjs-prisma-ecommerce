export type WishlistAvailability =
  | "in_stock"
  | "low_stock"
  | "out_of_stock";

export type WishlistStore = {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  logoUrl: string | null;
  sellerName: string;
};

export type WishlistItem = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  basePrice: number;
  availability: WishlistAvailability;
  totalStock: number;
  store: WishlistStore | null;
};

export type WishlistPayload = {
  productIds: string[];
  items: WishlistItem[];
};

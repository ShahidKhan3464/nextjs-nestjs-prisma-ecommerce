type CartItemStoreResponse = {
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

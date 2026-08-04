export type CartItemStore = {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  logoUrl: string | null;
  sellerName: string;
};

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  maxQty: number;
  quantity: number;
  productId: string;
  variantId: string;
  variantLabel: string;
  store: CartItemStore | null;
};

export type OrderAddress = {
  city: string;
  line1: string;
  line2?: string;
  region: string;
  phone?: string;
  country: string;
  fullName: string;
  postalCode: string;
};

export type OrderLineItemResponse = {
  image?: string;
  quantity: number;
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  priceAtPurchase: number;
  sku?: string;
};

type OrderStoreResponse = {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  sellerName: string;
  logoUrl: string | null;
};

type OrderBuyerResponse = {
  id: string;
  email: string;
  fullName: string;
};

export type OrderResponse = {
  id: string;
  tax: number;
  total: number;
  userId: string;
  status: string;
  storeId: string;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  orderNumber: string;
  deliveredAt?: string;
  cancelledAt?: string;
  paymentStatus: string;
  store?: OrderStoreResponse;
  buyer?: OrderBuyerResponse;
  cancellationReason?: string;
  paymentMethodSummary: string;
  shippingAddress: OrderAddress;
  items: OrderLineItemResponse[];
};

export type MapOrderOptions = {
  /** Include buyer contact (admin / seller fulfillment). */
  includeBuyer?: boolean;
};

type CheckoutPreview = {
  tax: number;
  total: number;
  subtotal: number;
};

export type CheckoutSessionResponse = {
  clientSecret: string;
  paymentIntentId: string;
  preview: CheckoutPreview;
  checkoutSessionId: string;
  orderIds: string[];
};

export type CompleteCheckoutResponse = {
  orders: OrderResponse[];
};

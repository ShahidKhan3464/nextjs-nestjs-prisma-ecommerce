export type OrderStatus = "pending" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "paid" | "failed" | "refunded";

export type OrderLineItem = {
  image?: string;
  quantity: number;
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  priceAtPurchase: number;
};

export type Order = {
  id: string;
  tax: number;
  total: number;
  userId: string;
  subtotal: number;
  createdAt: string;
  shippedAt?: string;
  orderNumber: string;
  status: OrderStatus;
  deliveredAt?: string;
  cancelledAt?: string;
  items: OrderLineItem[];
  shippingAddress: Address;
  cancellationReason?: string;
  paymentStatus: PaymentStatus;
  paymentMethodSummary: string;
};

export type Address = {
  id?: string;
  city: string;
  line1: string;
  line2?: string;
  phone?: string;
  region: string;
  country: string;
  fullName: string;
  postalCode: string;
};

export type OrderListParams = {
  status?: string;
  userId?: string;
  dateTo?: string;
  dateFrom?: string;
  paymentStatus?: string;
};

export type CancelOrderInput = {
  reason: string;
};

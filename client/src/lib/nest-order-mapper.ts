import { getBackendUrl } from "@/lib/backend-url";
import type { SellerOrder } from "@/modules/seller/orders/types";
import type { Order, OrderLineItem } from "@/modules/customer/orders/types";

export type NestOrderBuyerPayload = {
  email: string;
  fullName: string;
  id: string | number;
};

export type NestOrderPayload = {
  tax: number;
  total: number;
  status: string;
  subtotal: number;
  createdAt: string;
  shippedAt?: string;
  id: string | number;
  orderNumber?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  paymentStatus: string;
  userId: string | number;
  cancellationReason?: string;
  paymentMethodSummary: string;
  buyer?: NestOrderBuyerPayload;
  items: NestOrderLineItemPayload[];
  shippingAddress: {
    city: string;
    line1: string;
    line2?: string;
    region: string;
    phone?: string;
    country: string;
    fullName: string;
    postalCode: string;
  };
};

type NestOrderLineItemPayload = {
  image?: string;
  quantity: number;
  productName: string;
  variantLabel: string;
  priceAtPurchase: number;
  variantId: string | number;
  productId: string | number;
};

function normalizeImage(image?: string): string | undefined {
  if (!image) return undefined;
  const backend = getBackendUrl();
  return image.startsWith("/") ? `${backend}${image}` : image;
}

function normalizeLineItem(item: NestOrderLineItemPayload): OrderLineItem {
  return {
    quantity: item.quantity,
    productName: item.productName,
    variantLabel: item.variantLabel,
    variantId: String(item.variantId),
    image: normalizeImage(item.image),
    productId: String(item.productId),
    priceAtPurchase: Number(item.priceAtPurchase),
  };
}

export function normalizeNestOrderPayload(order: NestOrderPayload): Order {
  return {
    id: String(order.id),
    tax: Number(order.tax),
    shippedAt: order.shippedAt,
    createdAt: order.createdAt,
    total: Number(order.total),
    userId: String(order.userId),
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    subtotal: Number(order.subtotal),
    shippingAddress: order.shippingAddress,
    cancellationReason: order.cancellationReason,
    paymentMethodSummary: order.paymentMethodSummary,
    items: (order.items ?? []).map(normalizeLineItem),
    orderNumber: order.orderNumber ?? String(order.id),
    status: order.status.toLowerCase() as Order["status"],
    paymentStatus: (
      order.paymentStatus ?? "paid"
    ).toLowerCase() as Order["paymentStatus"],
  };
}

/** Seller/admin fulfillment payloads may include buyer contact. */
export function normalizeNestSellerOrderPayload(
  order: NestOrderPayload
): SellerOrder {
  const base = normalizeNestOrderPayload(order);
  if (!order.buyer) return base;
  return {
    ...base,
    buyer: {
      email: order.buyer.email,
      id: String(order.buyer.id),
      fullName: order.buyer.fullName,
    },
  };
}

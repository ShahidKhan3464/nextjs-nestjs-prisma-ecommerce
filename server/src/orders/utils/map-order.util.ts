import { OrderStatus, PaymentStatus } from '../constants/order.constants';
import {
  OrderWithRelations,
  OrderItemWithRelations,
  ProductVariantWithRelations,
} from 'src/common/types/domain.types';

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

type OrderLineItemResponse = {
  image?: string;
  quantity: number;
  variantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  priceAtPurchase: number;
};

export type OrderResponse = {
  id: string;
  tax: number;
  total: number;
  userId: string;
  status: string;
  subtotal: number;
  createdAt: string;
  shippedAt?: string;
  orderNumber: string;
  deliveredAt?: string;
  cancelledAt?: string;
  paymentStatus: string;
  cancellationReason?: string;
  paymentMethodSummary: string;
  shippingAddress: OrderAddress;
  items: OrderLineItemResponse[];
};

function formatVariantLabel(variant: ProductVariantWithRelations): string {
  const parts = [variant.size, variant.color].filter(
    (p) => typeof p === 'string' && p.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(' / ') : variant.sku;
}

function parseShippingAddress(raw: string): OrderAddress {
  try {
    return JSON.parse(raw) as OrderAddress;
  } catch {
    return {
      city: '',
      line1: raw,
      region: '',
      country: '',
      fullName: '',
      postalCode: '',
    };
  }
}

function mapEnumValue(value: OrderStatus | PaymentStatus): string {
  return value.toLowerCase();
}

function mapOrderItem(item: OrderItemWithRelations): OrderLineItemResponse {
  const variant = item.variant;
  const product = variant?.product;
  const image =
    item.imageUrl ??
    product?.images?.[0]?.urlPath ??
    (product?.images?.length ? product.images[0].urlPath : undefined);

  return {
    quantity: item.quantity,
    image: image || undefined,
    variantId: String(item.variantId),
    productName: product?.name ?? 'Product',
    productId: product ? String(product.id) : '',
    priceAtPurchase: Number(item.priceAtPurchase),
    variantLabel: variant ? formatVariantLabel(variant) : '',
  };
}

export function mapOrderToResponse(order: OrderWithRelations): OrderResponse {
  return {
    id: String(order.id),
    tax: Number(order.tax),
    userId: String(order.userId),
    orderNumber: order.orderNumber,
    subtotal: Number(order.subtotal),
    total: Number(order.totalAmount),
    status: mapEnumValue(order.status),
    createdAt: order.createdAt.toISOString(),
    shippedAt: order.shippedAt?.toISOString(),
    items: (order.items ?? []).map(mapOrderItem),
    deliveredAt: order.deliveredAt?.toISOString(),
    cancelledAt: order.cancelledAt?.toISOString(),
    paymentStatus: mapEnumValue(order.paymentStatus),
    cancellationReason: order.cancellationReason ?? undefined,
    paymentMethodSummary: order.paymentMethodSummary ?? 'Card',
    shippingAddress: parseShippingAddress(order.shippingAddress),
  };
}

export function generateOrderNumber(): string {
  const date = new Date();
  const ymd = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('');
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${ymd}-${suffix}`;
}

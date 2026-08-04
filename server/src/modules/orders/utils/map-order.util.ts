import { OrderStatus, PaymentStatus } from '../constants/order.constants';
import {
  OrderWithRelations,
  OrderItemWithRelations,
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
  sku?: string;
};

export type OrderStoreResponse = {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  sellerName: string;
  logoUrl: string | null;
};

export type OrderBuyerResponse = {
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

function formatVariantLabel(item: OrderItemWithRelations): string {
  const parts = [item.variantSize, item.variantColor].filter(
    (p) => typeof p === 'string' && p.trim().length > 0,
  );
  return parts.length > 0 ? parts.join(' / ') : item.variantSku;
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

function mapOrderStatus(value: OrderStatus): string {
  return value.toLowerCase();
}

/** Maps schema payment status to API values expected by the client. */
function mapPaymentStatus(value: PaymentStatus | undefined): string {
  switch (value) {
    case PaymentStatus.SUCCEEDED:
      return 'paid';
    case PaymentStatus.PENDING:
      return 'pending';
    case PaymentStatus.PROCESSING:
      return 'processing';
    case PaymentStatus.FAILED:
      return 'failed';
    case PaymentStatus.CANCELLED:
      return 'cancelled';
    case PaymentStatus.REFUNDED:
      return 'refunded';
    case PaymentStatus.PARTIALLY_REFUNDED:
      return 'partially_refunded';
    default:
      return 'pending';
  }
}

function mapOrderItem(item: OrderItemWithRelations): OrderLineItemResponse {
  return {
    sku: item.variantSku,
    quantity: item.quantity,
    productName: item.productName,
    variantId: String(item.variantId),
    variantLabel: formatVariantLabel(item),
    image: item.productImageUrl || undefined,
    priceAtPurchase: Number(item.priceAtPurchase),
    productId: item.variant ? String(item.variant.productId) : '',
  };
}

export function mapOrderToResponse(
  order: OrderWithRelations,
  options: MapOrderOptions = {},
): OrderResponse {
  const response: OrderResponse = {
    id: String(order.id),
    tax: Number(order.tax),
    userId: String(order.userId),
    storeId: String(order.storeId),
    orderNumber: order.orderNumber,
    subtotal: Number(order.subtotal),
    total: Number(order.totalAmount),
    status: mapOrderStatus(order.status),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    shippedAt: order.shippedAt?.toISOString(),
    items: (order.items ?? []).map(mapOrderItem),
    deliveredAt: order.deliveredAt?.toISOString(),
    cancelledAt: order.cancelledAt?.toISOString(),
    paymentStatus: mapPaymentStatus(order.payment?.status),
    cancellationReason: order.cancellationReason ?? undefined,
    paymentMethodSummary: order.payment?.methodSummary ?? 'Card',
    shippingAddress: parseShippingAddress(order.shippingAddress),
  };

  if (order.store) {
    response.store = {
      id: String(order.store.id),
      name: order.store.name,
      slug: order.store.slug,
      logoUrl: order.store.logoUrl ?? null,
      verified: Boolean(order.store.verifiedAt),
      sellerName: order.store.sellerName ?? order.store.name,
    };
  }

  if (options.includeBuyer && order.user) {
    response.buyer = {
      id: String(order.user.id),
      email: order.user.email,
      fullName: order.user.fullName,
    };
  }

  return response;
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

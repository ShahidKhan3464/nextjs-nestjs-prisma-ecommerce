import { getBackendUrl } from "@/lib/backend-url";
import type { SellerOrder } from "@/modules/seller/orders/types";
import type {
  Order,
  OrderLineItem,
  OrderStore,
} from "@/modules/buyer/orders/types";

type NestOrderBuyerPayload = {
  email: string;
  fullName: string;
  id: string | number;
};

type NestOrderStorePayload = {
  id: string | number;
  name: string;
  slug: string;
  verified?: boolean;
  logoUrl?: string | null;
  sellerName?: string;
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
  storeId?: string | number;
  cancellationReason?: string;
  paymentMethodSummary: string;
  store?: NestOrderStorePayload;
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

function normalizeImage(image?: string | null): string | undefined {
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

function normalizeStore(
  store?: NestOrderStorePayload
): OrderStore | undefined {
  if (!store) return undefined;
  return {
    id: String(store.id),
    name: store.name,
    slug: store.slug,
    verified: Boolean(store.verified),
    logoUrl: store.logoUrl ? normalizeImage(store.logoUrl) ?? null : null,
    sellerName: store.sellerName ?? store.name,
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
    store: normalizeStore(order.store),
    shippingAddress: order.shippingAddress,
    cancellationReason: order.cancellationReason,
    paymentMethodSummary: order.paymentMethodSummary,
    items: (order.items ?? []).map(normalizeLineItem),
    orderNumber: order.orderNumber ?? String(order.id),
    status: order.status.toLowerCase() as Order["status"],
    storeId: order.storeId != null ? String(order.storeId) : undefined,
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

type NestPagedOrdersPayload = {
  data?: NestOrderPayload[];
  page?: number;
  limit?: number;
  total?: number;
};

export type OrderPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function mapNestPagedOrdersEnvelope<T>(
  raw: unknown,
  mapOrder: (payload: NestOrderPayload) => T
): { orders: T[]; pagination: OrderPaginationMeta } {
  const empty: OrderPaginationMeta = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  if (Array.isArray(raw)) {
    const orders = raw.map(mapOrder);
    const limit = orders.length || 10;
    return {
      orders,
      pagination: {
        page: 1,
        limit,
        total: orders.length,
        totalPages: 1,
      },
    };
  }

  const paged = raw as NestPagedOrdersPayload | null;
  if (!paged || !Array.isArray(paged.data)) {
    return { orders: [], pagination: empty };
  }

  const orders = paged.data.map(mapOrder);
  const page = paged.page ?? 1;
  const limit = paged.limit ?? (orders.length || 10);
  const total = paged.total ?? orders.length;

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

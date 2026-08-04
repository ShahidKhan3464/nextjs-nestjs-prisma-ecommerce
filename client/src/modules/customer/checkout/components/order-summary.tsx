"use client";

import Image from "next/image";
import type { Order } from "../types";
import { PriceBreakdown } from "./price-breakdown";
import { formatMoney } from "../utils/format-money";
import { Separator } from "@/components/ui/separator";
import { StoreGroupHeader } from "@/modules/customer/shared/store-group-header";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/modules/customer/orders/components/order-status-badges";

type Props = {
  order: Order;
  compact?: boolean;
};

export function OrderSummary({ order, compact = false }: Props) {
  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs">Order</p>
          <p className="font-medium">{order.orderNumber}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <StoreGroupHeader
        store={
          order.store
            ? {
              name: order.store.name,
              slug: order.store.slug,
              verified: order.store.verified,
              logoUrl: order.store.logoUrl,
              sellerName: order.store.sellerName,
            }
            : null
        }
        compact={compact}
      />

      <ul className="space-y-3">
        {order.items.map((item) => (
          <li key={`${order.id}-${item.variantId}`} className="flex gap-3 text-sm">
            <span className="bg-muted relative size-12 shrink-0 overflow-hidden rounded-md border">
              {item.image ? (
                <Image
                  fill
                  alt=""
                  sizes="48px"
                  src={item.image}
                  className="object-cover"
                />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 font-medium">{item.productName}</span>
              {item.variantLabel ? (
                <span className="text-muted-foreground mt-0.5 block text-xs">
                  {item.variantLabel}
                </span>
              ) : null}
              <span className="text-muted-foreground mt-0.5 block text-xs">
                Qty {item.quantity}
              </span>
            </span>
            <span className="shrink-0 tabular-nums">
              {formatMoney(item.priceAtPurchase * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <Separator />
      <PriceBreakdown
        showEstimate={false}
        preview={{
          tax: order.tax,
          total: order.total,
          subtotal: order.subtotal,
        }}
        merchandiseSubtotal={order.subtotal}
      />
    </div>
  );
}

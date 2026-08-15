"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { formatOrderDate } from "@/lib/format-date";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { SellerOrderCodActions } from "@/modules/seller/payments";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSellerOrder,
  updateSellerOrderStatus,
} from "../services/orders.service";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/modules/buyer/orders/components/order-status-badges";

type Props = { orderId: string };

export function SellerOrderDetail({ orderId }: Props) {
  const qc = useQueryClient();

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.seller.orders.detail(orderId),
    queryFn: () => fetchSellerOrder(orderId),
  });

  const statusMutation = useMutation({
    mutationFn: (status: "SHIPPED" | "DELIVERED") =>
      updateSellerOrderStatus(orderId, status),
    onSuccess: (updatedOrder) => {
      toast.success("Order status updated");
      qc.setQueryData(queryKeys.seller.orders.detail(orderId), (current) =>
        current
          ? { ...current, order: updatedOrder }
          : { order: updatedOrder, customerUserId: updatedOrder.userId }
      );
      void qc.invalidateQueries({ queryKey: queryKeys.seller.orders.all });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.seller });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not update status"));
    },
  });

  const nextStatus = useMemo(() => {
    if (!data?.order) return null;
    if (data.order.status === "pending") return "SHIPPED" as const;
    if (data.order.status === "shipped") return "DELIVERED" as const;
    return null;
  }, [data?.order]);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Order not found"
        description="This order may not exist or does not belong to your store."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              Retry
            </Button>
            <Link
              href={ROUTES.orders}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Back to orders
            </Link>
          </div>
        }
      />
    );
  }

  const { order } = data;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Order</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
            {order.orderNumber}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Placed {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
          {nextStatus ? (
            <Button
              size="sm"
              disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate(nextStatus)}
            >
              Mark as {nextStatus === "SHIPPED" ? "shipped" : "delivered"}
            </Button>
          ) : null}
        </div>
      </div>

      {order.status === "cancelled" && order.cancellationReason ? (
        <p className="text-muted-foreground rounded-lg border px-4 py-3 text-sm">
          Cancellation reason: {order.cancellationReason}
        </p>
      ) : null}

      <SellerOrderCodActions orderId={order.id} />

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2 text-sm">
          <h2 className="font-medium tracking-wide uppercase">Customer</h2>
          {order.buyer ? (
            <div className="text-muted-foreground space-y-1 leading-relaxed">
              <p className="text-foreground font-medium">
                {order.buyer.fullName}
              </p>
              <p>{order.buyer.email}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">Customer details unavailable.</p>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <h2 className="font-medium tracking-wide uppercase">Shipping</h2>
          <p className="text-muted-foreground leading-relaxed">
            {order.shippingAddress.fullName}
            <br />
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? (
              <>
                <br />
                {order.shippingAddress.line2}
              </>
            ) : null}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.region}{" "}
            {order.shippingAddress.postalCode}
            <br />
            {order.shippingAddress.country}
            {order.shippingAddress.phone ? (
              <>
                <br />
                {order.shippingAddress.phone}
              </>
            ) : null}
          </p>
          {order.shippedAt ? (
            <p className="text-muted-foreground text-xs">
              Shipped {formatOrderDate(order.shippedAt)}
            </p>
          ) : null}
          {order.deliveredAt ? (
            <p className="text-muted-foreground text-xs">
              Delivered {formatOrderDate(order.deliveredAt)}
            </p>
          ) : null}
        </div>
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide uppercase">
          Items ({itemCount})
        </h2>
        <ul className="divide-y rounded-xl border">
          {order.items.map((item) => (
            <li
              key={`${item.variantId}-${item.priceAtPurchase}`}
              className="flex gap-4 p-4"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.image ? (
                  <Image
                    fill
                    alt=""
                    sizes="64px"
                    src={item.image}
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-muted-foreground text-sm">
                  {item.variantLabel} × {item.quantity}
                </p>
                <p className="text-muted-foreground text-xs">
                  ${item.priceAtPurchase.toFixed(2)} each
                </p>
              </div>
              <p className="tabular-nums">
                ${(item.priceAtPurchase * item.quantity).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <Separator />

      <section className="space-y-3 text-sm">
        <h2 className="font-medium tracking-wide uppercase">Revenue summary</h2>
        <div className="max-w-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="tabular-nums">${order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">${order.total.toFixed(2)}</span>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          Payment: {order.paymentMethodSummary}
        </p>
      </section>

      <Link
        href={ROUTES.orders}
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        All orders
      </Link>
    </div>
  );
}

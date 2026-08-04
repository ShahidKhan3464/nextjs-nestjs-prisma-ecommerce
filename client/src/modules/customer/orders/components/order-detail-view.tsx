"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { formatOrderDate } from "@/lib/format-date";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { Separator } from "@/components/ui/separator";
import { Button, buttonVariants } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchOrder, cancelOrder } from "../services/orders.service";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { OrderStatusBadge, PaymentStatusBadge } from "./order-status-badges";
import { StoreGroupHeader } from "@/modules/customer/shared/store-group-header";
import { VerifiedBadge } from "@/modules/customer/products/components/verified-badge";
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";


type Props = {
  orderId: string;
};

export function OrderDetailView({ orderId }: Props) {
  const qc = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => fetchOrder(orderId),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId, { reason: cancelReason.trim() }),
    onSuccess: (updated) => {
      toast.success("Order cancelled");
      qc.setQueryData(queryKeys.orders.detail(orderId), updated);
      void qc.invalidateQueries({ queryKey: queryKeys.orders.list() });
      setCancelOpen(false);
      setCancelReason("");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not cancel order"));
    },
  });

  const canCancel = useMemo(() => data?.status === "pending", [data?.status]);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-14 w-72" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Order not found"
        description="This order may not exist or you may not have access."
        action={
          <Link
            href={ROUTES.orders}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back to orders
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">Order</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {data.orderNumber}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Placed {formatOrderDate(data.createdAt)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={data.status} />
            <PaymentStatusBadge status={data.paymentStatus} />
          </div>
          {canCancel ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelOpen(true)}
            >
              Cancel order
            </Button>
          ) : null}
        </div>
      </div>

      {data.status === "cancelled" && data.cancellationReason ? (
        <p className="text-muted-foreground rounded-lg border px-4 py-3 text-sm">
          Cancellation reason: {data.cancellationReason}
        </p>
      ) : null}

      {data.store ? (
        <section className="space-y-3 rounded-xl border p-4">
          <h2 className="text-sm font-medium tracking-wide uppercase">
            Store
          </h2>
          <StoreGroupHeader
            store={{
              name: data.store.name,
              slug: data.store.slug,
              verified: data.store.verified,
              logoUrl: data.store.logoUrl,
              sellerName: data.store.sellerName,
            }}
            trailing={data.store.verified ? <VerifiedBadge /> : null}
          />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide uppercase">
          Tracking
        </h2>
        <div className="text-muted-foreground space-y-1 rounded-xl border px-4 py-3 text-sm">
          <p>
            Status:{" "}
            <span className="text-foreground font-medium capitalize">
              {data.status}
            </span>
          </p>
          {data.shippedAt ? (
            <p>Shipped {formatOrderDate(data.shippedAt)}</p>
          ) : (
            <p>Not shipped yet</p>
          )}
          {data.deliveredAt ? (
            <p>Delivered {formatOrderDate(data.deliveredAt)}</p>
          ) : null}
          {data.cancelledAt ? (
            <p>Cancelled {formatOrderDate(data.cancelledAt)}</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium tracking-wide uppercase">Items</h2>
        <ul className="divide-y rounded-xl border">
          {data.items.map((item) => (
            <li
              key={`${item.variantId}-${item.priceAtPurchase}`}
              className="flex gap-4 p-4"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.image && (
                  <Image
                    fill
                    alt=""
                    sizes="64px"
                    src={item.image}
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-muted-foreground text-sm">
                  {item.variantLabel} × {item.quantity}
                </p>
                <p className="text-muted-foreground text-xs">
                  Price at purchase: ${item.priceAtPurchase.toFixed(2)} each
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

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2 text-sm">
          <h2 className="font-medium tracking-wide uppercase">Shipping</h2>
          <p className="text-muted-foreground leading-relaxed">
            {data.shippingAddress.fullName}
            <br />
            {data.shippingAddress.line1}
            {data.shippingAddress.line2 && (
              <>
                <br />
                {data.shippingAddress.line2}
              </>
            )}
            <br />
            {data.shippingAddress.city}, {data.shippingAddress.region}{" "}
            {data.shippingAddress.postalCode}
            <br />
            {data.shippingAddress.country}
          </p>
          {data.shippedAt ? (
            <p className="text-muted-foreground text-xs">
              Shipped {formatOrderDate(data.shippedAt)}
            </p>
          ) : null}
          {data.deliveredAt ? (
            <p className="text-muted-foreground text-xs">
              Delivered {formatOrderDate(data.deliveredAt)}
            </p>
          ) : null}
        </div>
        <div className="space-y-3 text-sm">
          <h2 className="font-medium tracking-wide uppercase">Payment</h2>
          <p className="text-muted-foreground">{data.paymentMethodSummary}</p>
          <div className="space-y-1 border-t pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">${data.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="tabular-nums">${data.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">${data.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </section>

      <Link
        href={ROUTES.orders}
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        All orders
      </Link>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              Your payment will be refunded and stock will be restored. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label htmlFor="cancel-reason" className="text-sm font-medium">
              Reason for cancellation
            </label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              placeholder="Tell us why you are cancelling"
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={
                cancelMutation.isPending || cancelReason.trim().length === 0
              }
              onClick={() => cancelMutation.mutate()}
            >
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

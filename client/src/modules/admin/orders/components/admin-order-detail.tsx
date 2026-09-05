"use client";

import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/constants/query-keys";
import { formatOrderDate } from "@/lib/format-date";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api-error";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import { AdminDetailSkeleton } from "@/modules/admin/shared";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  fetchAdminOrder,
  cancelAdminOrder,
  updateAdminOrderStatus,
} from "../services/orders.service";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/modules/buyer/orders/components/order-status-badges";

type Props = { orderId: string };

export function AdminOrderDetail({ orderId }: Props) {
  const qc = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.admin.order(orderId),
    queryFn: () => fetchAdminOrder(orderId),
  });

  const statusMutation = useMutation({
    mutationFn: (status: "SHIPPED" | "DELIVERED") =>
      updateAdminOrderStatus(orderId, status),
    onSuccess: (updatedOrder) => {
      toast.success("Order status updated");
      qc.setQueryData(queryKeys.admin.order(orderId), (current) =>
        current
          ? { ...current, order: updatedOrder }
          : { order: updatedOrder, customerUserId: updatedOrder.userId }
      );
      void qc.invalidateQueries({ queryKey: queryKeys.admin.orders() });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not update status"));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      cancelAdminOrder(orderId, { reason: cancelReason.trim() }),
    onSuccess: (updatedOrder) => {
      toast.success("Order cancelled and refunded");
      qc.setQueryData(queryKeys.admin.order(orderId), (current) =>
        current
          ? { ...current, order: updatedOrder }
          : { order: updatedOrder, customerUserId: updatedOrder.userId }
      );
      void qc.invalidateQueries({ queryKey: queryKeys.admin.orders() });
      setCancelOpen(false);
      setCancelReason("");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not cancel order"));
    },
  });

  const nextStatus = useMemo(() => {
    if (!data?.order) return null;
    if (data.order.status === "pending") return "SHIPPED" as const;
    if (data.order.status === "shipped") return "DELIVERED" as const;
    return null;
  }, [data?.order]);

  const canCancel = data?.order.status === "pending";

  if (isPending) {
    return <AdminDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Order not found"
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

  const { order, customerUserId } = data;

  return (
    <>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_500px]">
        <div className="space-y-6">
          <div>
            <p className="text-muted-foreground text-sm">Order</p>
            <h1 className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
              {order.orderNumber}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Placed {formatOrderDate(order.createdAt)}
            </p>
          </div>

          {order.status === "cancelled" && order.cancellationReason ? (
            <p className="text-muted-foreground rounded-lg border px-4 py-3 text-sm">
              Cancellation reason: {order.cancellationReason}
            </p>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-sm font-medium tracking-wide uppercase">
              Items
            </h2>
            <ul className="divide-y rounded-xl border">
              {order.items.map((item) => (
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
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-muted-foreground text-sm">
                      {item.variantLabel} × {item.quantity}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Snapshot ${item.priceAtPurchase.toFixed(2)} each
                    </p>
                  </div>
                  <p className="tabular-nums">
                    ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="bg-muted/40 border-border space-y-6 rounded-xl border p-4 lg:sticky lg:top-28">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <div className="flex flex-wrap gap-2">
              {nextStatus ? (
                <Button
                  size="sm"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate(nextStatus)}
                >
                  Mark as {nextStatus === "SHIPPED" ? "shipped" : "delivered"}
                </Button>
              ) : null}
              {canCancel ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setCancelOpen(true)}
                >
                  Cancel order
                </Button>
              ) : null}
            </div>
            <Link
              href={ROUTES.user(customerUserId)}
              className="text-primary text-sm hover:underline"
            >
              View customer
            </Link>
          </div>

          <section className="space-y-2 text-sm">
            <h2 className="font-medium tracking-wide uppercase">Shipping</h2>
            <p className="text-muted-foreground leading-relaxed">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.line1}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.region}{" "}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
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
          </section>

          <Separator />

          <section className="space-y-3 text-sm">
            <h2 className="font-medium tracking-wide uppercase">Payment</h2>
            <p className="text-muted-foreground">
              {order.paymentMethodSummary}
            </p>
            <div className="space-y-1 border-t pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">
                  ${order.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </section>

          <Link
            href={ROUTES.orders}
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            All orders
          </Link>
        </aside>
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              The customer will be refunded and inventory will be restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label
              htmlFor="admin-cancel-reason"
              className="text-sm font-medium"
            >
              Cancellation reason
            </label>
            <Textarea
              id="admin-cancel-reason"
              value={cancelReason}
              placeholder="Required for audit trail"
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
              Cancel and refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

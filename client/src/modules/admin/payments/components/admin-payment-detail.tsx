"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import { AdminDetailSkeleton } from "@/modules/admin/shared";
import { RefundPaymentDialog } from "./refund-payment-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { fetchAdminPayment } from "../services/payments.service";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import {
  PaymentStatusBadge,
  formatPaymentAmount,
  PaymentProviderBadge,
} from "./payment-badges";

type Props = { paymentId: string };

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return format(new Date(iso), "MMM d, yyyy · HH:mm");
}

function MetaCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 border-border rounded-lg border p-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

export function AdminPaymentDetail({ paymentId }: Props) {
  const [refundOpen, setRefundOpen] = useState(false);

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.admin.payments.detail(paymentId),
    queryFn: () => fetchAdminPayment(paymentId),
  });

  if (isPending) {
    return <AdminDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Payment not found"
        description="This payment may have been removed or the id is invalid."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
            <Link
              href={ROUTES.payments}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Back to payments
            </Link>
          </div>
        }
      />
    );
  }

  const payment = data;
  const remaining = Math.max(0, payment.amount - payment.refundedAmount);
  const canRefund =
    remaining > 0 &&
    (payment.status === "SUCCEEDED" ||
      payment.status === "PARTIALLY_REFUNDED" ||
      payment.status === "PENDING");

  return (
    <div
      className={cn(
        "grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_500px]",
        isFetching ? "opacity-90" : undefined
      )}
    >
      <div className="space-y-6">
        <div className="min-w-0 space-y-2">
          <p className="text-muted-foreground text-sm">Payment</p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            #{payment.id}
          </h2>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <PaymentStatusBadge status={payment.status} />
            <PaymentProviderBadge provider={payment.provider} />
            {payment.methodSummary ? (
              <Badge variant="outline">{payment.methodSummary}</Badge>
            ) : null}
          </div>
        </div>

        {payment.failureReason ? (
          <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-4 text-sm">
            <p className="font-medium">Failure reason</p>
            <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
              {payment.failureReason}
            </p>
          </div>
        ) : null}

        {payment.refundReason ? (
          <div className="rounded-lg border p-4 text-sm">
            <p className="font-medium">Refund reason</p>
            <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
              {payment.refundReason}
            </p>
            {payment.refundedAt ? (
              <p className="text-muted-foreground mt-2 text-xs tabular-nums">
                Refunded {formatDateTime(payment.refundedAt)}
              </p>
            ) : null}
          </div>
        ) : null}

        <section className="space-y-3 text-sm">
          <h3 className="font-medium tracking-wide uppercase">Order</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-muted-foreground">Order</dt>
              <dd>
                <Link
                  href={ROUTES.order(payment.orderId)}
                  className="font-medium hover:underline"
                >
                  {payment.order?.orderNumber ?? `#${payment.orderId}`}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Buyer user id</dt>
              <dd className="font-mono">
                {payment.order?.userId ? (
                  <Link
                    href={ROUTES.user(payment.order.userId)}
                    className="hover:underline"
                  >
                    {payment.order.userId}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Store id</dt>
              <dd className="font-mono">
                {payment.order?.storeId ? (
                  <Link
                    href={ROUTES.adminStore(payment.order.storeId)}
                    className="hover:underline"
                  >
                    {payment.order.storeId}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <aside className="bg-muted/40 border-border space-y-4 rounded-xl border p-4 lg:sticky lg:top-28">
        {canRefund ? (
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            onClick={() => setRefundOpen(true)}
          >
            Record refund
          </Button>
        ) : null}

        <MetaCard label="Amount">
          <p className="font-medium tabular-nums">
            {formatPaymentAmount(payment.amount, payment.currency)}
          </p>
        </MetaCard>
        <MetaCard label="Refunded">
          <p className="tabular-nums">
            {formatPaymentAmount(payment.refundedAmount, payment.currency)}
          </p>
        </MetaCard>
        <MetaCard label="Created">
          <p className="tabular-nums">{formatDateTime(payment.createdAt)}</p>
        </MetaCard>
        <MetaCard label="Paid at">
          <p className="tabular-nums">{formatDateTime(payment.paidAt)}</p>
        </MetaCard>

        <section className="space-y-3 text-sm">
          <h3 className="font-medium tracking-wide uppercase">References</h3>
          <dl className="space-y-2">
            <div>
              <dt className="text-muted-foreground">Transaction id</dt>
              <dd className="font-mono text-xs break-all">
                {payment.transactionId || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">External refund id</dt>
              <dd className="font-mono text-xs break-all">
                {payment.externalRefundId || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Updated</dt>
              <dd className="tabular-nums">
                {formatDateTime(payment.updatedAt)}
              </dd>
            </div>
          </dl>
        </section>

        <Link
          href={ROUTES.payments}
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          All payments
        </Link>
      </aside>

      <RefundPaymentDialog
        open={refundOpen}
        payment={payment}
        onOpenChange={setRefundOpen}
      />
    </div>
  );
}

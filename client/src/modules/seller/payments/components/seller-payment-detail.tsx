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
import { Skeleton } from "@/components/ui/skeleton";
import { RejectCodDialog } from "./reject-cod-dialog";
import { ConfirmCodDialog } from "./confirm-cod-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { fetchSellerPayment } from "../services/payments.service";
import { EmptyState } from "@/shared/components/feedback/empty-state";
import {
  PaymentStatusBadge,
  formatPaymentAmount,
  PaymentProviderBadge,
} from "@/modules/admin/payments/components/payment-badges";

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
    <div className="bg-background border-border rounded-lg border p-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

function PaymentDetailSkeleton() {
  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_500px]">
      <div className="space-y-6">
        <Skeleton className="h-24 w-full max-w-md" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
      <aside className="space-y-4 rounded-xl border bg-muted/40 p-4 lg:sticky lg:top-28">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </aside>
    </div>
  );
}

export function SellerPaymentDetail({ paymentId }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.seller.payments.detail(paymentId),
    queryFn: () => fetchSellerPayment(paymentId),
  });

  if (isPending) {
    return <PaymentDetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        title="Payment not found"
        description="This payment may not exist or does not belong to your store."
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
  const canManageCod =
    payment.provider === "COD" && payment.status === "PENDING";

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

        <section className="space-y-3 text-sm">
          <h3 className="font-medium tracking-wide uppercase">Order</h3>
          <p>
            <Link
              href={ROUTES.order(payment.orderId)}
              className="font-medium hover:underline"
            >
              {payment.order?.orderNumber ?? `#${payment.orderId}`}
            </Link>
          </p>
        </section>

        <Link
          href={ROUTES.payments}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          All payments
        </Link>
      </div>

      <aside className="bg-muted/40 border-border space-y-4 rounded-xl border p-4 lg:sticky lg:top-28">
        {canManageCod ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => setConfirmOpen(true)}>
              Confirm COD
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setRejectOpen(true)}
            >
              Reject COD
            </Button>
          </div>
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
      </aside>

      <ConfirmCodDialog
        payment={payment}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      />
      <RejectCodDialog
        open={rejectOpen}
        payment={payment}
        onOpenChange={setRejectOpen}
      />
    </div>
  );
}

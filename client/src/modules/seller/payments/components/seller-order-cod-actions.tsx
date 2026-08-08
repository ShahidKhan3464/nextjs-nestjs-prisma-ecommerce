"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/query-keys";
import type { Payment } from "@/modules/admin/payments/types";
import { RejectCodDialog } from "@/modules/seller/payments/components/reject-cod-dialog";
import { fetchSellerPayments } from "@/modules/seller/payments/services/payments.service";
import { ConfirmCodDialog } from "@/modules/seller/payments/components/confirm-cod-dialog";
import {
  PaymentStatusBadge,
  formatPaymentAmount,
  PaymentProviderBadge,
} from "@/modules/admin/payments/components/payment-badges";

type Props = { orderId: string };

export function SellerOrderCodActions({ orderId }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.seller.payments.list({ orderId, page: 1, limit: 5 }),
    queryFn: () => fetchSellerPayments({ orderId, page: 1, limit: 5 }),
  });

  const payment: Payment | undefined = data?.data.find(
    (item) => item.provider === "COD" && item.status === "PENDING"
  );

  if (isPending || isError || !payment) return null;

  return (
    <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Cash on delivery pending</p>
          <div className="flex flex-wrap items-center gap-2">
            <PaymentProviderBadge provider={payment.provider} />
            <PaymentStatusBadge status={payment.status} />
            <span className="text-muted-foreground text-sm tabular-nums">
              {formatPaymentAmount(payment.amount, payment.currency)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => setConfirmOpen(true)}>
            Confirm COD
          </Button>
          <Button
            size="sm"
            type="button"
            variant="destructive"
            onClick={() => setRejectOpen(true)}
          >
            Reject COD
          </Button>
        </div>
      </div>

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

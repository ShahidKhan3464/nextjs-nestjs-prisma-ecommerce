"use client";

import { Button } from "@/components/ui/button";
import type { PaymentFailure, PaymentUiStatus } from "../types";
import { paymentFailureTitle } from "../utils/map-payment-error";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

type Props = {
  status: PaymentUiStatus;
  failure?: PaymentFailure | null;
  onRetry?: () => void;
  onRestart?: () => void;
};

export function PaymentStatus({ status, failure, onRetry, onRestart }: Props) {
  if (status === "idle" || status === "validating") {
    return null;
  }

  if (status === "processing") {
    return (
      <div
        role="status"
        className="bg-muted/50 flex items-center gap-3 rounded-lg border p-4 text-sm"
      >
        <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
        <div>
          <p className="font-medium">Processing payment</p>
          <p className="text-muted-foreground text-xs">
            Please do not close this page. Confirming with your payment
            provider…
          </p>
        </div>
      </div>
    );
  }

  if (status === "succeeded") {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/40"
      >
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
        <div>
          <p className="font-medium">Payment successful</p>
          <p className="text-muted-foreground text-xs">Creating your orders…</p>
        </div>
      </div>
    );
  }

  if (status === "failed" && failure) {
    const canRetry =
      failure.kind === "failed" ||
      failure.kind === "network" ||
      failure.kind === "incomplete" ||
      failure.kind === "cancelled";
    const needsRestart = failure.kind === "expired" || failure.kind === "stale";

    return (
      <div
        role="alert"
        className="border-destructive/30 bg-destructive/5 flex flex-col gap-3 rounded-lg border p-4 text-sm"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="text-destructive mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 space-y-1">
            <p className="font-medium">{paymentFailureTitle(failure.kind)}</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {failure.message}
            </p>
            {failure.kind === "network" ? (
              <p className="text-muted-foreground text-xs">
                If you were charged, use Retry — completing checkout is
                idempotent and will not create duplicate orders.
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canRetry && onRetry ? (
            <Button type="button" size="sm" onClick={onRetry}>
              <RefreshCw className="size-3.5" />
              Retry payment
            </Button>
          ) : null}
          {needsRestart && onRestart ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onRestart}
            >
              Restart checkout
            </Button>
          ) : null}
          {!needsRestart && onRestart ? (
            <Button type="button" size="sm" variant="ghost" onClick={onRestart}>
              Change shipping
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return null;
}

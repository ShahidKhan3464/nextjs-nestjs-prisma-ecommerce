import type { PaymentProvider, PaymentStatus } from "../types";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

const statusVariant: Record<PaymentStatus, BadgeVariant> = {
  FAILED: "destructive",
  PENDING: "outline",
  REFUNDED: "secondary",
  SUCCEEDED: "default",
  CANCELLED: "destructive",
  PROCESSING: "secondary",
  PARTIALLY_REFUNDED: "secondary",
};

const providerLabel: Record<PaymentProvider, string> = {
  STRIPE: "Card",
  COD: "COD",
  OTHER: "Other",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={statusVariant[status]}>{status.replaceAll("_", " ")}</Badge>;
}

export function PaymentProviderBadge({
  provider,
}: {
  provider: PaymentProvider;
}) {
  return <Badge variant="outline">{providerLabel[provider]}</Badge>;
}

export function formatPaymentAmount(
  amount: number,
  currency = "USD"
): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

import { Badge } from "@/components/ui/badge";
import type { OrderStatus, PaymentStatus } from "../types";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

const orderStatusVariant: Record<OrderStatus, BadgeVariant> = {
  pending: "outline",
  shipped: "secondary",
  delivered: "default",
  cancelled: "destructive",
};

/** Chart bar fills aligned with each status badge variant. */
export const orderStatusChartColor: Record<OrderStatus, string> = {
  pending: "var(--muted-foreground)",
  shipped: "var(--secondary-foreground)",
  delivered: "var(--primary)",
  cancelled: "var(--destructive)",
};

export function normalizeOrderStatus(status: string): OrderStatus {
  const key = status.toLowerCase() as OrderStatus;
  if (key in orderStatusVariant) return key;
  return "pending";
}

const paymentStatusVariant: Record<PaymentStatus, BadgeVariant> = {
  paid: "default",
  failed: "destructive",
  refunded: "secondary",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={orderStatusVariant[status]}>{status}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={paymentStatusVariant[status]}>{status}</Badge>;
}

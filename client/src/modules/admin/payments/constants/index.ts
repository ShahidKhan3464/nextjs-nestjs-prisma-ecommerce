import type {
  PaymentProviderFilter,
  PaymentStatusFilter,
} from "../types";

export const PAYMENT_STATUS_FILTER_OPTIONS: {
  value: PaymentStatusFilter;
  label: string;
}[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SUCCEEDED", label: "Succeeded" },
  { value: "PARTIALLY_REFUNDED", label: "Partially refunded" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "FAILED", label: "Failed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const PAYMENT_PROVIDER_FILTER_OPTIONS: {
  value: PaymentProviderFilter;
  label: string;
}[] = [
  { value: "ALL", label: "All methods" },
  { value: "STRIPE", label: "Card (Stripe)" },
  { value: "COD", label: "Cash on delivery" },
  { value: "OTHER", label: "Other" },
];

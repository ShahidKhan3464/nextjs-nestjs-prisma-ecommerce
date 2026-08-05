import type { Order } from "@/modules/customer/orders/types";
import type { Address } from "@/modules/customer/orders/types";

export type { Address, Order };

export type PaymentProviderId =
  | "stripe"
  | "cod"
  | "paypal"
  | "easypaisa"
  | "jazzcash";

export type PaymentProviderMeta = {
  id: PaymentProviderId;
  label: string;
  description: string;
  /** Shown in checkout UI; only enabled providers can be selected. */
  enabled: boolean;
  /** Online SDK / redirect capture (Stripe, PayPal, wallets). */
  supportsOnlineCapture: boolean;
  /** Placeholder until Nest checkout wires the provider. */
  comingSoon: boolean;
};

export type CreateCheckoutInput = {
  shippingAddress: Address;
};

export type CheckoutPreview = {
  tax: number;
  total: number;
  subtotal: number;
};

export type CheckoutSession = {
  orderIds?: string[];
  clientSecret: string;
  paymentIntentId: string;
  preview: CheckoutPreview;
  checkoutSessionId: string;
};

export type CompleteCheckoutInput = {
  paymentIntentId: string;
};

export type CheckoutStep = "shipping" | "payment" | "review";

export type PaymentFailureKind =
  | "cancelled"
  | "expired"
  | "failed"
  | "network"
  | "incomplete"
  | "stale";

export type PaymentUiStatus =
  | "idle"
  | "validating"
  | "processing"
  | "succeeded"
  | "failed";

export type PaymentFailure = {
  kind: PaymentFailureKind;
  message: string;
};

/** Snapshot persisted for success page + session recovery. */
export type CheckoutSuccessSnapshot = {
  orders: Order[];
  completedAt: string;
  checkoutSessionId: string;
};

export type PersistedCheckoutSession = {
  createdAt: string;
  step: CheckoutStep;
  orderIds: string[];
  clientSecret: string;
  paymentIntentId: string;
  checkoutSessionId: string;
  preview: CheckoutPreview;
  shippingAddress: Address;
  paymentSummary: string | null;
  paymentProvider: PaymentProviderId;
};

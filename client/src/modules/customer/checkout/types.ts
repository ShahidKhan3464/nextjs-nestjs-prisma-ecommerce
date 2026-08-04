import type { Order } from "@/modules/customer/orders/types";
import type { PaymentProviderId } from "./payment-providers";
import type { Address } from "@/modules/customer/orders/types";

export type { Address, Order };

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

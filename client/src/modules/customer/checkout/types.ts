import type { Address } from "@/modules/customer/orders/types";

export type { Address };

export type CreateCheckoutInput = {
  shippingAddress: Address;
};

type CheckoutPreview = {
  tax: number;
  total: number;
  subtotal: number;
};

export type CheckoutSession = {
  clientSecret: string;
  paymentIntentId: string;
  preview: CheckoutPreview;
  checkoutSessionId: string;
};

export type CompleteCheckoutInput = {
  paymentIntentId: string;
};

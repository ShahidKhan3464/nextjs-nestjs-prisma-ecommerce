import type { PaymentProviderId, PaymentProviderMeta } from "./types";

export const PAYMENT_PROVIDERS: PaymentProviderMeta[] = [
  {
    id: "stripe",
    label: "Card",
    description: "Pay securely with credit or debit card via Stripe.",
    enabled: true,
    supportsOnlineCapture: true,
    comingSoon: false,
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    description: "Pay with cash when your order arrives.",
    enabled: false,
    supportsOnlineCapture: false,
    comingSoon: true,
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "Checkout with your PayPal account.",
    enabled: false,
    supportsOnlineCapture: true,
    comingSoon: true,
  },
  {
    id: "easypaisa",
    label: "Easypaisa",
    description: "Pay with your Easypaisa wallet.",
    enabled: false,
    supportsOnlineCapture: true,
    comingSoon: true,
  },
  {
    id: "jazzcash",
    label: "JazzCash",
    description: "Pay with your JazzCash wallet.",
    enabled: false,
    supportsOnlineCapture: true,
    comingSoon: true,
  },
];

export const DEFAULT_PAYMENT_PROVIDER: PaymentProviderId = "stripe";

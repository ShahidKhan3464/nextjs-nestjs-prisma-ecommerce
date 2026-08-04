/**
 * Frontend payment provider registry.
 * Mirrors backend capabilities without exposing secrets.
 * Active capture today: Stripe. Others are prepared for future wiring.
 */

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

export function getPaymentProvider(
  id: PaymentProviderId
): PaymentProviderMeta | undefined {
  return PAYMENT_PROVIDERS.find((p) => p.id === id);
}

export function getEnabledPaymentProviders(): PaymentProviderMeta[] {
  return PAYMENT_PROVIDERS.filter((p) => p.enabled);
}

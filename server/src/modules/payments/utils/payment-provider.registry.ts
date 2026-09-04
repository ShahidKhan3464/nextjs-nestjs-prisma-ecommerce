import { PaymentProvider } from 'src/common/enums/payment-provider.enum';

/**
 * Capability flags for payment providers.
 * New providers (PayPal, JazzCash, etc.) register here without changing callers.
 */
export type PaymentProviderCapabilities = {
  /** Online capture via provider APIs / client SDKs. */
  supportsOnlineCapture: boolean;
  /** Provider can issue refunds against a prior capture. */
  supportsRefund: boolean;
  /** Confirmation is expected via provider callbacks / webhooks. */
  expectsProviderCallback: boolean;
  /** Default methodSummary when creating a payment for this provider. */
  defaultMethodSummary: string;
};

const PAYMENT_PROVIDER_CAPABILITIES: Record<
  PaymentProvider,
  PaymentProviderCapabilities
> = {
  [PaymentProvider.STRIPE]: {
    supportsOnlineCapture: true,
    supportsRefund: true,
    expectsProviderCallback: true,
    defaultMethodSummary: 'Card',
  },
  [PaymentProvider.COD]: {
    supportsOnlineCapture: false,
    supportsRefund: false,
    expectsProviderCallback: false,
    defaultMethodSummary: 'Cash on Delivery',
  },
  [PaymentProvider.OTHER]: {
    supportsOnlineCapture: false,
    supportsRefund: false,
    expectsProviderCallback: false,
    defaultMethodSummary: 'Other',
  },
};

export function getPaymentProviderCapabilities(
  provider: PaymentProvider,
): PaymentProviderCapabilities {
  return (
    PAYMENT_PROVIDER_CAPABILITIES[provider] ??
    PAYMENT_PROVIDER_CAPABILITIES[PaymentProvider.OTHER]
  );
}

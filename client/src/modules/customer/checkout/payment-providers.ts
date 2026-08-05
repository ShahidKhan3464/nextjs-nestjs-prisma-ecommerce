/**
 * Frontend payment provider helpers.
 * Registry lives in `constants.ts`; types in `types.ts`.
 */

import { PAYMENT_PROVIDERS } from "./constants";
import type { PaymentProviderId, PaymentProviderMeta } from "./types";

export type { PaymentProviderId, PaymentProviderMeta } from "./types";
export { PAYMENT_PROVIDERS, DEFAULT_PAYMENT_PROVIDER } from "./constants";

export function getPaymentProvider(
  id: PaymentProviderId
): PaymentProviderMeta | undefined {
  return PAYMENT_PROVIDERS.find((p) => p.id === id);
}

export function getEnabledPaymentProviders(): PaymentProviderMeta[] {
  return PAYMENT_PROVIDERS.filter((p) => p.enabled);
}

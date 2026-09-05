"use client";

import { PAYMENT_PROVIDERS } from "../constants";
import type { PaymentProviderId } from "../types";
import { PaymentMethodCard } from "./payment-method-card";
import { StripePaymentForm } from "./stripe-payment-form";

type Props = {
  selectedProvider: PaymentProviderId;
  onSelectProvider: (id: PaymentProviderId) => void;
};

/**
 * Provider-independent payment UI.
 * Capture forms are rendered per selected provider; only Stripe is live today.
 * Parent must wrap Stripe capture with StripeCheckoutProvider / Elements.
 */
export function PaymentPanel({ selectedProvider, onSelectProvider }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Payment method</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAYMENT_PROVIDERS.map((provider) => (
            <PaymentMethodCard
              key={provider.id}
              provider={provider}
              onSelect={onSelectProvider}
              selected={selectedProvider === provider.id}
            />
          ))}
        </div>
      </div>

      {selectedProvider === "stripe" ? (
        <StripePaymentForm />
      ) : (
        <p className="text-muted-foreground text-sm">
          This payment method is not available yet. Please select Card.
        </p>
      )}
    </div>
  );
}

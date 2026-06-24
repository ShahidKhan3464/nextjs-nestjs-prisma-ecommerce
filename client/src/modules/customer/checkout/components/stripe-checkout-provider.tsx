"use client";

import * as React from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type Props = {
  clientSecret: string;
  children: React.ReactNode;
};

export function StripeCheckoutProvider({ clientSecret, children }: Props) {
  const options = React.useMemo(
    () => ({
      clientSecret,
      appearance: {
        theme: "stripe" as const,
        variables: { borderRadius: "6px" },
      },
    }),
    [clientSecret]
  );

  if (!stripePromise) {
    return (
      <p className="text-destructive text-sm">
        Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </p>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}

"use client";

import * as React from "react";
import type { StripeElementChangeEvent } from "@stripe/stripe-js";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
} from "@stripe/react-stripe-js";

const cardElementOptions = {
  disableLink: true,
  style: {
    base: {
      fontSize: "16px",
      color: "#0a0a0a",
      fontFamily: "inherit",
      "::placeholder": { color: "#737373" },
    },
    invalid: { color: "#ef4444" },
  },
};

export function StripePaymentForm() {
  const [cardComplete, setCardComplete] = React.useState(false);
  const [expiryComplete, setExpiryComplete] = React.useState(false);
  const [cvcComplete, setCvcComplete] = React.useState(false);

  function handleChange(setter: React.Dispatch<React.SetStateAction<boolean>>) {
    return (event: StripeElementChangeEvent) => {
      setter(event.complete);
    };
  }

  React.useEffect(() => {
    const detail = {
      complete: cardComplete && expiryComplete && cvcComplete,
    };
    window.dispatchEvent(
      new CustomEvent("stripe-card-form-change", { detail })
    );
  }, [cardComplete, expiryComplete, cvcComplete]);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Pay securely with your credit or debit card.
      </p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Card number</label>
          <div className="border-input bg-background rounded-md border px-3 py-3">
            <CardNumberElement
              options={cardElementOptions}
              onChange={handleChange(setCardComplete)}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Expiration date</label>
            <div className="border-input bg-background rounded-md border px-3 py-3">
              <CardExpiryElement
                options={cardElementOptions}
                onChange={handleChange(setExpiryComplete)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">CVC</label>
            <div className="border-input bg-background rounded-md border px-3 py-3">
              <CardCvcElement
                options={cardElementOptions}
                onChange={handleChange(setCvcComplete)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

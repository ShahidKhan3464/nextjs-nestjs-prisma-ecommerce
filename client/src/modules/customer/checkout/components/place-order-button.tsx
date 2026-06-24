"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import { useCheckoutStore } from "@/store/checkout-store";
import { completeCheckout } from "../services/checkout.service";
import {
  CardNumberElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

type Props = {
  onSuccess: () => void;
};

export function PlaceOrderButton({ onSuccess }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const clientSecret = useCheckoutStore((s) => s.clientSecret);
  const [loading, setLoading] = React.useState(false);

  async function handlePlaceOrder() {
    if (!stripe || !elements || !clientSecret) {
      toast.error("Payment form is not ready yet");
      return;
    }

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      toast.error("Card details are missing");
      return;
    }

    setLoading(true);
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: { card: cardNumber },
        }
      );

      if (error) {
        toast.error(error.message ?? "Payment failed");
        return;
      }

      if (!paymentIntent || paymentIntent.status !== "succeeded") {
        toast.error("Payment was not completed");
        return;
      }

      await completeCheckout({
        paymentIntentId: paymentIntent.id,
      });
      onSuccess();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Checkout failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      disabled={loading}
      onClick={() => void handlePlaceOrder()}
    >
      {loading ? "Processing…" : "Place order"}
    </Button>
  );
}

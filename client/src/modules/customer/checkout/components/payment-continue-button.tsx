"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CardNumberElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

type Props = {
  onContinue: () => void;
};

export function PaymentContinueButton({ onContinue }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = React.useState(false);
  const [cardComplete, setCardComplete] = React.useState(false);

  React.useEffect(() => {
    function onCardChange(event: Event) {
      const detail = (event as CustomEvent<{ complete: boolean }>).detail;
      setCardComplete(detail.complete);
    }
    window.addEventListener("stripe-card-form-change", onCardChange);
    return () =>
      window.removeEventListener("stripe-card-form-change", onCardChange);
  }, []);

  async function handleContinue() {
    if (!stripe || !elements) {
      toast.error("Payment form is not ready yet");
      return;
    }

    if (!cardComplete) {
      toast.error("Please enter your complete card details");
      return;
    }

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      toast.error("Card details are missing");
      return;
    }

    setLoading(true);
    try {
      const { error } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumber,
      });
      if (error) {
        toast.error(error.message ?? "Please check your card details");
        return;
      }
      onContinue();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      disabled={loading}
      onClick={() => void handleContinue()}
    >
      {loading ? "Validating…" : "Continue to review"}
    </Button>
  );
}

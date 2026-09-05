"use client";

import * as React from "react";
import { toast } from "sonner";
import type { Order } from "../types";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import { useCheckoutStore } from "@/store/checkout-store";
import { completeCheckout } from "../services/checkout.service";
import {
  mapStripePaymentError,
  mapNetworkPaymentError,
} from "../utils/map-payment-error";
import {
  CardNumberElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

type Props = {
  onSuccess: (orders: Order[]) => void;
  onRetryReady?: () => void;
};

export function PlaceOrderButton({ onSuccess, onRetryReady }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const submitting = useCheckoutStore((s) => s.submitting);
  const clientSecret = useCheckoutStore((s) => s.clientSecret);
  const setSubmitting = useCheckoutStore((s) => s.setSubmitting);
  const paymentFailure = useCheckoutStore((s) => s.paymentFailure);
  const paymentIntentId = useCheckoutStore((s) => s.paymentIntentId);
  const setPaymentStatus = useCheckoutStore((s) => s.setPaymentStatus);
  const attemptRef = React.useRef(false);

  async function finalizeOrders(piId: string) {
    setPaymentStatus("succeeded");
    const orders = await completeCheckout({ paymentIntentId: piId });
    onSuccess(orders);
  }

  async function handlePlaceOrder() {
    if (attemptRef.current || submitting) return;

    if (!stripe || !elements || !clientSecret || !paymentIntentId) {
      toast.error("Payment form is not ready yet");
      return;
    }

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      toast.error("Card details are missing");
      return;
    }

    attemptRef.current = true;
    setSubmitting(true);
    setPaymentStatus("processing");

    try {
      // After a network failure, payment may already have succeeded — recover via complete.
      if (paymentFailure?.kind === "network") {
        try {
          await finalizeOrders(paymentIntentId);
          return;
        } catch {
          // Fall through to Stripe confirm + complete.
        }
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: { card: cardNumber },
        }
      );

      if (error) {
        // Stripe may report unexpected_state when PI already succeeded.
        if (
          error.code === "payment_intent_unexpected_state" &&
          paymentIntentId
        ) {
          try {
            await finalizeOrders(paymentIntentId);
            return;
          } catch (completeErr) {
            const failure = mapNetworkPaymentError(completeErr);
            setPaymentStatus("failed", failure);
            toast.error(getApiErrorMessage(completeErr, failure.message));
            onRetryReady?.();
            return;
          }
        }

        const failure = mapStripePaymentError(error);
        setPaymentStatus("failed", failure);
        toast.error(failure.message);
        onRetryReady?.();
        return;
      }

      if (!paymentIntent) {
        const failure = {
          kind: "incomplete" as const,
          message: "Payment was not completed",
        };
        setPaymentStatus("failed", failure);
        toast.error(failure.message);
        onRetryReady?.();
        return;
      }

      if (paymentIntent.status === "requires_payment_method") {
        const failure = {
          kind: "failed" as const,
          message: "Your card was declined. Try another card.",
        };
        setPaymentStatus("failed", failure);
        toast.error(failure.message);
        onRetryReady?.();
        return;
      }

      if (paymentIntent.status !== "succeeded") {
        const failure = {
          kind: "incomplete" as const,
          message: `Payment status: ${paymentIntent.status}. Please wait or retry.`,
        };
        setPaymentStatus("failed", failure);
        toast.error(failure.message);
        onRetryReady?.();
        return;
      }

      await finalizeOrders(paymentIntent.id);
    } catch (err) {
      const failure = mapNetworkPaymentError(err);
      setPaymentStatus("failed", failure);
      toast.error(getApiErrorMessage(err, failure.message));
      onRetryReady?.();
    } finally {
      attemptRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <Button
      size="lg"
      type="button"
      className="w-full sm:w-auto"
      onClick={() => void handlePlaceOrder()}
      disabled={submitting || !stripe || !elements}
    >
      {submitting ? "Processing…" : "Place order"}
    </Button>
  );
}

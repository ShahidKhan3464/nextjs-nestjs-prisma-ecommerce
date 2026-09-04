"use client";

import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Address, CheckoutSession } from "../types";
import { useCheckoutStore } from "@/store/checkout-store";
import { cancelCheckout, createCheckout } from "../services/checkout.service";

export function useCreateCheckoutSession() {
  const setCheckoutSession = useCheckoutStore((s) => s.setCheckoutSession);
  const clearCheckoutSession = useCheckoutStore((s) => s.clearCheckoutSession);
  const setShipping = useCheckoutStore((s) => s.setShipping);

  return useMutation({
    mutationKey: ["checkout", "create"],
    mutationFn: async (shippingAddress: Address) => {
      const existing = useCheckoutStore.getState().paymentIntentId;
      if (existing) {
        try {
          await cancelCheckout(existing);
        } catch {
          // Prior session may already be expired/cancelled.
        }
        clearCheckoutSession();
        const nextKey = crypto.randomUUID();
        useCheckoutStore.getState().setIdempotencyKey(nextKey);
      }
      setShipping(shippingAddress);
      let idempotencyKey = useCheckoutStore.getState().idempotencyKey;
      if (!idempotencyKey) {
        idempotencyKey = crypto.randomUUID();
        useCheckoutStore.getState().setIdempotencyKey(idempotencyKey);
      }
      return createCheckout({ shippingAddress, idempotencyKey });
    },
    onSuccess: (session: CheckoutSession) => {
      setCheckoutSession({
        paymentIntentId: session.paymentIntentId,
        clientSecret: session.clientSecret,
        checkoutSessionId: session.checkoutSessionId,
        preview: session.preview,
        orderIds: session.orderIds ?? [],
      });
      toast.success("Ready for payment");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Could not start checkout"));
    },
  });
}

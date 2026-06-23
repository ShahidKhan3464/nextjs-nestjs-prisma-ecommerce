import { create } from "zustand";
import type { Address } from "@/modules/customer/checkout/types";

type CheckoutStep = "shipping" | "payment" | "review";

interface CheckoutState {
  step: CheckoutStep;
  clientSecret: string | null;
  paymentIntentId: string | null;
  paymentSummary: string | null;
  setStep: (step: CheckoutStep) => void;
  setShipping: (address: Address) => void;
  shippingAddress: Partial<Address> | null;
  setPaymentSummary: (summary: string) => void;
  setCheckoutSession: (paymentIntentId: string, clientSecret: string) => void;
  clearCheckoutSession: () => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  step: "shipping",
  clientSecret: null,
  paymentIntentId: null,
  paymentSummary: null,
  shippingAddress: null,
  setStep: (step) => set({ step }),
  setShipping: (shippingAddress) => set({ shippingAddress }),
  setCheckoutSession: (paymentIntentId, clientSecret) =>
    set({ paymentIntentId, clientSecret, step: "payment" }),
  setPaymentSummary: (paymentSummary) =>
    set({ paymentSummary, step: "review" }),
  clearCheckoutSession: () =>
    set({ clientSecret: null, paymentIntentId: null, step: "shipping" }),
  reset: () =>
    set({
      step: "shipping",
      clientSecret: null,
      paymentIntentId: null,
      paymentSummary: null,
      shippingAddress: null,
    }),
}));

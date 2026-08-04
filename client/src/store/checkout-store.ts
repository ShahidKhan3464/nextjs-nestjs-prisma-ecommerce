import { create } from "zustand";
import type { Address } from "@/modules/customer/checkout/types";
import type {
  CheckoutPreview,
  CheckoutStep,
  PaymentFailure,
  PaymentUiStatus,
} from "@/modules/customer/checkout/types";
import {
  type PaymentProviderId,
  DEFAULT_PAYMENT_PROVIDER,
} from "@/modules/customer/checkout/payment-providers";
import {
  clearPersistedCheckoutSession,
  loadPersistedCheckoutSession,
  persistCheckoutSession,
} from "@/modules/customer/checkout/utils/checkout-session-storage";

interface CheckoutState {
  hydrated: boolean;
  step: CheckoutStep;
  orderIds: string[];
  submitting: boolean;
  clientSecret: string | null;
  paymentSummary: string | null;
  paymentIntentId: string | null;
  paymentStatus: PaymentUiStatus;
  preview: CheckoutPreview | null;
  checkoutSessionId: string | null;
  paymentProvider: PaymentProviderId;
  paymentFailure: PaymentFailure | null;
  setStep: (step: CheckoutStep) => void;
  setShipping: (address: Address) => void;
  shippingAddress: Partial<Address> | null;
  setPaymentSummary: (summary: string) => void;
  setSubmitting: (submitting: boolean) => void;
  setPaymentProvider: (provider: PaymentProviderId) => void;
  setPaymentStatus: (status: PaymentUiStatus, failure?: PaymentFailure | null) => void;
  setCheckoutSession: (session: {
    paymentIntentId: string;
    clientSecret: string;
    checkoutSessionId: string;
    preview: CheckoutPreview;
    orderIds?: string[];
  }) => void;
  clearCheckoutSession: () => void;
  hydrateFromStorage: () => void;
  syncPersistence: () => void;
  reset: () => void;
}

const initialState = {
  step: "shipping" as CheckoutStep,
  hydrated: false,
  clientSecret: null as string | null,
  paymentIntentId: null as string | null,
  checkoutSessionId: null as string | null,
  orderIds: [] as string[],
  preview: null as CheckoutPreview | null,
  paymentSummary: null as string | null,
  paymentProvider: DEFAULT_PAYMENT_PROVIDER as PaymentProviderId,
  paymentStatus: "idle" as PaymentUiStatus,
  paymentFailure: null as PaymentFailure | null,
  shippingAddress: null as Partial<Address> | null,
  submitting: false,
};

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  ...initialState,
  setStep: (step) => {
    set({ step });
    get().syncPersistence();
  },
  setShipping: (shippingAddress) => {
    set({ shippingAddress });
    get().syncPersistence();
  },
  setPaymentProvider: (paymentProvider) => {
    set({ paymentProvider });
    get().syncPersistence();
  },
  setPaymentSummary: (paymentSummary) =>
    set({ paymentSummary }),
  setPaymentStatus: (paymentStatus, failure = null) =>
    set({
      paymentStatus,
      paymentFailure: failure ?? null,
    }),
  setSubmitting: (submitting) => set({ submitting }),
  setCheckoutSession: ({
    paymentIntentId,
    clientSecret,
    checkoutSessionId,
    preview,
    orderIds = [],
  }) => {
    set({
      paymentIntentId,
      clientSecret,
      checkoutSessionId,
      preview,
      orderIds,
      step: "payment",
      paymentStatus: "idle",
      paymentFailure: null,
      submitting: false,
    });
    get().syncPersistence();
  },
  clearCheckoutSession: () => {
    clearPersistedCheckoutSession();
    set({
      clientSecret: null,
      paymentIntentId: null,
      checkoutSessionId: null,
      orderIds: [],
      preview: null,
      paymentSummary: null,
      paymentStatus: "idle",
      paymentFailure: null,
      submitting: false,
      step: "shipping",
    });
  },
  hydrateFromStorage: () => {
    if (get().hydrated) return;
    const persisted = loadPersistedCheckoutSession();
    if (!persisted) {
      set({ hydrated: true });
      return;
    }
    set({
      hydrated: true,
      step: persisted.step === "shipping" ? "payment" : persisted.step,
      clientSecret: persisted.clientSecret,
      paymentIntentId: persisted.paymentIntentId,
      checkoutSessionId: persisted.checkoutSessionId,
      orderIds: persisted.orderIds,
      preview: persisted.preview,
      shippingAddress: persisted.shippingAddress,
      paymentProvider: persisted.paymentProvider,
      paymentSummary: persisted.paymentSummary,
      paymentStatus: "idle",
      paymentFailure: null,
    });
  },
  syncPersistence: () => {
    const state = get();
    if (
      !state.paymentIntentId ||
      !state.clientSecret ||
      !state.checkoutSessionId ||
      !state.preview ||
      !state.shippingAddress?.fullName
    ) {
      return;
    }
    persistCheckoutSession({
      step: state.step,
      clientSecret: state.clientSecret,
      paymentIntentId: state.paymentIntentId,
      checkoutSessionId: state.checkoutSessionId,
      orderIds: state.orderIds,
      preview: state.preview,
      shippingAddress: state.shippingAddress as Address,
      paymentProvider: state.paymentProvider,
      paymentSummary: state.paymentSummary,
      createdAt: new Date().toISOString(),
    });
  },
  reset: () => {
    clearPersistedCheckoutSession();
    set({ ...initialState, hydrated: true });
  },
}));

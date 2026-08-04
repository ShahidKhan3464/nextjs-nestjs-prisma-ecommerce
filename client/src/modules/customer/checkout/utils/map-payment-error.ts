import type { PaymentFailure, PaymentFailureKind } from "../types";

const STRIPE_CODE_TO_KIND: Record<string, PaymentFailureKind> = {
  payment_intent_payment_attempt_failed: "failed",
  payment_intent_unexpected_state: "stale",
  payment_intent_incompatible_payment_method: "failed",
  card_declined: "failed",
  expired_card: "expired",
  incorrect_cvc: "failed",
  processing_error: "failed",
  incomplete_number: "incomplete",
  incomplete_cvc: "incomplete",
  incomplete_expiry: "incomplete",
};

export function mapStripePaymentError(error: {
  code?: string;
  type?: string;
  message?: string;
  decline_code?: string;
}): PaymentFailure {
  const code = error.code ?? error.decline_code ?? "";
  const kind =
    STRIPE_CODE_TO_KIND[code] ??
    (error.type === "validation_error" ? "incomplete" : "failed");

  const message =
    error.message ??
    (kind === "expired"
      ? "Your card has expired. Use a different card or retry."
      : kind === "cancelled"
        ? "Payment was cancelled."
        : kind === "stale"
          ? "This checkout session is no longer valid. Restart checkout."
          : "Payment failed. Please try again.");

  return { kind, message };
}

export function mapNetworkPaymentError(error: unknown): PaymentFailure {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Network error while confirming payment. Your card may already have been charged — retry carefully.";
  return { kind: "network", message };
}

export function paymentFailureTitle(kind: PaymentFailureKind): string {
  switch (kind) {
    case "cancelled":
      return "Payment cancelled";
    case "expired":
      return "Payment expired";
    case "stale":
      return "Checkout session expired";
    case "network":
      return "Connection problem";
    case "incomplete":
      return "Incomplete payment details";
    case "failed":
    default:
      return "Payment failed";
  }
}

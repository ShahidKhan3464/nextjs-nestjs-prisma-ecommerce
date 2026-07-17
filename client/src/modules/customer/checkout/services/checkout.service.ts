import { api } from "@/services/api/client";
import type { ApiResponse } from "@/types/api";
import type { Order } from "@/modules/customer/orders/types";
import type {
  CheckoutSession,
  CreateCheckoutInput,
  CompleteCheckoutInput,
} from "../types";

export async function createCheckout(body: CreateCheckoutInput) {
  const res = await api.post<ApiResponse<CheckoutSession>>(
    "/api/v1/customer/orders/checkout",
    body
  );
  return res.data.data;
}

export async function cancelCheckout(paymentIntentId: string) {
  await api.post("/api/v1/customer/orders/checkout/cancel", {
    paymentIntentId,
  });
}

/** Best-effort server cleanup when the user abandons checkout. */
export function abandonCheckout(paymentIntentId: string | null | undefined) {
  if (!paymentIntentId) return;
  void cancelCheckout(paymentIntentId).catch(() => {
    // Ignore errors — session may already be completed or expired.
  });
}

export async function completeCheckout(body: CompleteCheckoutInput) {
  const res = await api.post<ApiResponse<{ orders: Order[]; order: Order }>>(
    "/api/v1/customer/orders/checkout/complete",
    body
  );
  return res.data.data.orders ?? [res.data.data.order];
}

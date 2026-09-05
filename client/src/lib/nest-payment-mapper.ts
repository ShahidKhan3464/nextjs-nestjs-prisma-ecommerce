import { unwrapNestDataResponsePayload } from "@/lib/nest-http";
import type {
  Payment,
  PaymentStatus,
  PaymentProvider,
  PaymentOrderSummary,
} from "@/modules/admin/payments/types";

const PAYMENT_STATUSES = new Set<PaymentStatus>([
  "FAILED",
  "PENDING",
  "REFUNDED",
  "SUCCEEDED",
  "CANCELLED",
  "PROCESSING",
  "PARTIALLY_REFUNDED",
]);

const PAYMENT_PROVIDERS = new Set<PaymentProvider>(["STRIPE", "COD", "OTHER"]);

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function mapOrder(raw: unknown): PaymentOrderSummary | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const id = asString(o.id);
  const orderNumber = asString(o.orderNumber);
  const storeId = asString(o.storeId);
  const userId = asString(o.userId);
  if (!id || !orderNumber || !storeId || !userId) return undefined;
  return { id, orderNumber, storeId, userId };
}

export function mapNestPayment(raw: unknown): Payment | null {
  const payload = unwrapNestDataResponsePayload(raw);
  if (!payload || typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;

  const id = asString(o.id);
  const orderId = asString(o.orderId);
  const provider = asString(o.provider);
  const status = asString(o.status);
  const amount = asNumber(o.amount);
  const currency = asString(o.currency);
  const refundedAmount = asNumber(o.refundedAmount);
  const createdAt = asString(o.createdAt);
  const updatedAt = asString(o.updatedAt);

  if (
    !id ||
    !orderId ||
    !provider ||
    !status ||
    amount == null ||
    !currency ||
    refundedAmount == null ||
    !createdAt ||
    !updatedAt ||
    !PAYMENT_PROVIDERS.has(provider as PaymentProvider) ||
    !PAYMENT_STATUSES.has(status as PaymentStatus)
  ) {
    return null;
  }

  const order = mapOrder(o.order);

  return {
    id,
    orderId,
    provider: provider as PaymentProvider,
    status: status as PaymentStatus,
    amount,
    currency,
    refundedAmount,
    createdAt,
    updatedAt,
    ...(asString(o.transactionId)
      ? { transactionId: asString(o.transactionId)! }
      : {}),
    ...(asString(o.methodSummary)
      ? { methodSummary: asString(o.methodSummary)! }
      : {}),
    ...(asString(o.paidAt) ? { paidAt: asString(o.paidAt)! } : {}),
    ...(asString(o.failureReason)
      ? { failureReason: asString(o.failureReason)! }
      : {}),
    ...(asString(o.refundReason)
      ? { refundReason: asString(o.refundReason)! }
      : {}),
    ...(asString(o.refundedAt) ? { refundedAt: asString(o.refundedAt)! } : {}),
    ...(asString(o.externalRefundId)
      ? { externalRefundId: asString(o.externalRefundId)! }
      : {}),
    ...(order ? { order } : {}),
  };
}

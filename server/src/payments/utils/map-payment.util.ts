import { PaymentWithRelations } from 'src/common/types/domain.types';
import { PaymentProvider, PaymentStatus } from '../constants/payment.constants';

export type PaymentOrderSummary = {
  id: string;
  orderNumber: string;
  storeId: string;
  userId: string;
};

export type PaymentResponse = {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  amount: number;
  currency: string;
  refundedAmount: number;
  createdAt: string;
  updatedAt: string;
  transactionId?: string;
  methodSummary?: string;
  paidAt?: string;
  failureReason?: string;
  refundReason?: string;
  refundedAt?: string;
  externalRefundId?: string;
  order?: PaymentOrderSummary;
};

export type MapPaymentOptions = {
  /** Include failure reason (buyer/seller/admin when payment failed or cancelled). */
  includeFailureReason?: boolean;
  /** Include refund details when any refund amount exists. */
  includeRefundDetails?: boolean;
};

type PaymentOrderSource = {
  id: number;
  orderNumber: string;
  storeId: number;
  userId: number;
};

export type PaymentWithOrder = PaymentWithRelations & {
  order?: PaymentOrderSource;
};

function shouldExposeFailureReason(
  payment: PaymentWithRelations,
  options: MapPaymentOptions,
): boolean {
  if (!options.includeFailureReason || !payment.failureReason) {
    return false;
  }

  return (
    payment.status === PaymentStatus.FAILED ||
    payment.status === PaymentStatus.CANCELLED
  );
}

function shouldExposeRefundDetails(
  payment: PaymentWithRelations,
  options: MapPaymentOptions,
): boolean {
  if (!options.includeRefundDetails) {
    return false;
  }

  return (
    payment.refundedAmount > 0 ||
    payment.status === PaymentStatus.REFUNDED ||
    payment.status === PaymentStatus.PARTIALLY_REFUNDED
  );
}

export function mapPaymentToResponse(
  payment: PaymentWithOrder,
  options: MapPaymentOptions = {
    includeFailureReason: true,
    includeRefundDetails: true,
  },
): PaymentResponse {
  const response: PaymentResponse = {
    id: String(payment.id),
    orderId: String(payment.orderId),
    provider: payment.provider,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    refundedAmount: payment.refundedAmount,
    createdAt: payment.createdAt.toISOString(),
    updatedAt: payment.updatedAt.toISOString(),
    transactionId: payment.transactionId ?? undefined,
    methodSummary: payment.methodSummary ?? undefined,
    paidAt: payment.paidAt?.toISOString(),
  };

  if (shouldExposeFailureReason(payment, options)) {
    response.failureReason = payment.failureReason ?? undefined;
  }

  if (shouldExposeRefundDetails(payment, options)) {
    response.refundReason = payment.refundReason ?? undefined;
    response.refundedAt = payment.refundedAt?.toISOString();
    response.externalRefundId = payment.externalRefundId ?? undefined;
  }

  if (payment.order) {
    response.order = {
      id: String(payment.order.id),
      orderNumber: payment.order.orderNumber,
      storeId: String(payment.order.storeId),
      userId: String(payment.order.userId),
    };
  }

  return response;
}

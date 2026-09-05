import { PaymentStatus } from '../constants/payment.constants';
import { PaymentWithRelations } from 'src/common/types/domain.types';
import type {
  MapPaymentOptions,
  PaymentResponse,
  PaymentWithOrder,
} from '../types/payment.types';

export type {
  PaymentResponse,
  MapPaymentOptions,
  PaymentWithOrder,
} from '../types/payment.types';

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

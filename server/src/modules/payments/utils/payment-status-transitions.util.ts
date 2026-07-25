import { BadRequestException } from '@nestjs/common';
import { PaymentStatus } from '../constants/payment.constants';

const ALLOWED_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [
    PaymentStatus.PROCESSING,
    PaymentStatus.SUCCEEDED,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
  ],
  [PaymentStatus.PROCESSING]: [
    PaymentStatus.SUCCEEDED,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
  ],
  [PaymentStatus.SUCCEEDED]: [
    PaymentStatus.REFUNDED,
    PaymentStatus.PARTIALLY_REFUNDED,
  ],
  [PaymentStatus.PARTIALLY_REFUNDED]: [
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
  ],
  [PaymentStatus.FAILED]: [],
  [PaymentStatus.CANCELLED]: [],
  [PaymentStatus.REFUNDED]: [],
};

export function canTransitionPaymentStatus(
  from: PaymentStatus,
  to: PaymentStatus,
): boolean {
  if (from === to) {
    return true;
  }
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertPaymentStatusTransition(
  from: PaymentStatus,
  to: PaymentStatus,
): void {
  if (canTransitionPaymentStatus(from, to)) {
    return;
  }

  throw new BadRequestException(
    `Invalid payment status transition from ${from} to ${to}`,
  );
}

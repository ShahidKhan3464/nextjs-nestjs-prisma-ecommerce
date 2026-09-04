import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { BadRequestException } from '@nestjs/common';
import {
  canTransitionPaymentStatus,
  assertPaymentStatusTransition,
} from 'src/modules/payments/utils/payment-status-transitions.util';

describe('payment status transitions', () => {
  it('allows PENDING → SUCCEEDED and SUCCEEDED → REFUNDED', () => {
    expect(
      canTransitionPaymentStatus(
        PaymentStatus.PENDING,
        PaymentStatus.SUCCEEDED,
      ),
    ).toBe(true);
    expect(
      canTransitionPaymentStatus(
        PaymentStatus.SUCCEEDED,
        PaymentStatus.REFUNDED,
      ),
    ).toBe(true);
  });

  it('rejects SUCCEEDED → FAILED', () => {
    expect(
      canTransitionPaymentStatus(PaymentStatus.SUCCEEDED, PaymentStatus.FAILED),
    ).toBe(false);
    expect(() =>
      assertPaymentStatusTransition(
        PaymentStatus.SUCCEEDED,
        PaymentStatus.FAILED,
      ),
    ).toThrow(BadRequestException);
  });

  it('treats identical status as allowed (idempotent)', () => {
    expect(
      canTransitionPaymentStatus(
        PaymentStatus.SUCCEEDED,
        PaymentStatus.SUCCEEDED,
      ),
    ).toBe(true);
  });
});

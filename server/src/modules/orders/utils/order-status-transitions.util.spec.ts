import { OrderStatus } from 'src/common/enums/order-status.enum';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { PaymentProvider } from 'src/common/enums/payment-provider.enum';
import { BadRequestException } from '@nestjs/common';
import {
  canTransitionOrderStatus,
  assertOrderCanEnterShipped,
} from './order-status-transitions.util';

describe('order status transitions', () => {
  it('allows PENDING → SHIPPED and SHIPPED → DELIVERED', () => {
    expect(
      canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.SHIPPED),
    ).toBe(true);
    expect(
      canTransitionOrderStatus(OrderStatus.SHIPPED, OrderStatus.DELIVERED),
    ).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(
      canTransitionOrderStatus(OrderStatus.PENDING, OrderStatus.DELIVERED),
    ).toBe(false);
    expect(
      canTransitionOrderStatus(OrderStatus.DELIVERED, OrderStatus.SHIPPED),
    ).toBe(false);
    expect(
      canTransitionOrderStatus(OrderStatus.CANCELLED, OrderStatus.SHIPPED),
    ).toBe(false);
  });

  it('blocks shipping Stripe orders until payment succeeded', () => {
    expect(() =>
      assertOrderCanEnterShipped({
        paymentStatus: PaymentStatus.PENDING,
        paymentProvider: PaymentProvider.STRIPE,
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      assertOrderCanEnterShipped({
        paymentStatus: PaymentStatus.SUCCEEDED,
        paymentProvider: PaymentProvider.STRIPE,
      }),
    ).not.toThrow();
  });

  it('allows COD to ship while payment is still pending', () => {
    expect(() =>
      assertOrderCanEnterShipped({
        paymentStatus: PaymentStatus.PENDING,
        paymentProvider: PaymentProvider.COD,
      }),
    ).not.toThrow();
  });

  it('rejects shipping when COD payment failed', () => {
    expect(() =>
      assertOrderCanEnterShipped({
        paymentStatus: PaymentStatus.FAILED,
        paymentProvider: PaymentProvider.COD,
      }),
    ).toThrow(BadRequestException);
  });
});

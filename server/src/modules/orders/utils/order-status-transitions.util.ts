import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { PaymentProvider } from 'src/common/enums/payment-provider.enum';

/**
 * Allowed forward-only transitions for PATCH status.
 * PENDING → CANCELLED is handled by CancelOrderProvider.
 */
export const ALLOWED_ORDER_STATUS_TRANSITIONS: Partial<
  Record<OrderStatus, OrderStatus[]>
> = {
  [OrderStatus.PENDING]: [OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
};

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return ALLOWED_ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Stripe (and similar captured) orders cannot ship until payment succeeded.
 * COD may ship while payment is still pending — that is the delivery model.
 */
export function assertOrderCanEnterShipped(input: {
  paymentStatus?: PaymentStatus | null;
  paymentProvider?: PaymentProvider | null;
}): void {
  const provider = input.paymentProvider ?? PaymentProvider.STRIPE;
  if (provider === PaymentProvider.COD) {
    if (
      input.paymentStatus === PaymentStatus.FAILED ||
      input.paymentStatus === PaymentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Cannot ship an order whose COD payment was rejected',
      );
    }
    return;
  }

  if (input.paymentStatus !== PaymentStatus.SUCCEEDED) {
    throw new BadRequestException(
      'Cannot ship an order until payment has succeeded',
    );
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentStatus } from '../constants/order.constants';
import type { StripePaymentIntent } from 'src/integrations/stripe';
import { PaymentFailureReason } from 'src/modules/payments/constants/payment.constants';

/**
 * Stripe `payment_intent.payment_failed` is not terminal — the customer can retry
 * the same PaymentIntent. Do not release stock or expire the session here.
 */
@Injectable()
export class HandlePaymentFailedProvider {
  private readonly logger = new Logger(HandlePaymentFailedProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(paymentIntent: StripePaymentIntent): Promise<void> {
    const reason =
      paymentIntent.last_payment_error?.message?.slice(0, 255) ||
      PaymentFailureReason.CARD_DECLINED;

    const result = await this.prisma.payment.updateMany({
      where: {
        transactionId: paymentIntent.id,
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
        },
      },
      data: {
        status: PaymentStatus.PROCESSING,
        failureReason: reason,
      },
    });

    this.logger.warn(
      `PaymentIntent ${paymentIntent.id} failed (${reason}); updated ${result.count} payment(s). Stock remains reserved until checkout expires or succeeds.`,
    );
  }
}

import { StripeService } from 'src/integrations/stripe';
import { PrismaService } from 'src/prisma/prisma.service';
import { adjustVariantStock } from '../utils/adjust-variant-stock.util';
import {
  OrderStatus,
  PaymentStatus,
  CheckoutSessionStatus,
} from '../constants/order.constants';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class CancelCheckoutProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  async cancel(paymentIntentId: string, userId: number): Promise<void> {
    const session = await this.prisma.checkoutSession.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
        status: CheckoutSessionStatus.PENDING,
      },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException();
    }

    let paymentIntentStatus: string;
    try {
      const paymentIntent =
        await this.stripeService.retrievePaymentIntent(paymentIntentId);
      paymentIntentStatus = paymentIntent.status;
    } catch {
      throw new ServiceUnavailableException(
        'Unable to verify payment status; try again shortly',
      );
    }

    if (paymentIntentStatus === 'succeeded') {
      throw new BadRequestException(
        'Payment already succeeded; complete checkout instead',
      );
    }

    if (paymentIntentStatus === 'processing') {
      throw new BadRequestException(
        'Payment is still processing and cannot be cancelled',
      );
    }

    if (paymentIntentStatus !== 'canceled') {
      try {
        await this.stripeService.cancelPaymentIntent(paymentIntentId);
      } catch {
        /* PI may have succeeded between retrieve and cancel — re-check. */
      }

      try {
        const again =
          await this.stripeService.retrievePaymentIntent(paymentIntentId);
        paymentIntentStatus = again.status;
      } catch {
        throw new ServiceUnavailableException(
          'Unable to verify payment status; try again shortly',
        );
      }

      if (paymentIntentStatus === 'succeeded') {
        throw new BadRequestException(
          'Payment already succeeded; complete checkout instead',
        );
      }

      if (paymentIntentStatus === 'processing') {
        throw new BadRequestException(
          'Payment is still processing and cannot be cancelled',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.checkoutSession.updateMany({
        where: {
          id: session.id,
          status: CheckoutSessionStatus.PENDING,
        },
        data: { status: CheckoutSessionStatus.CANCELLED },
      });

      if (claimed.count === 0) {
        throw new BadRequestException('Checkout session is no longer pending');
      }

      const linked = await tx.order.findMany({
        where: {
          checkoutSessionId: session.id,
          userId,
          status: OrderStatus.PENDING,
        },
        select: { id: true },
      });
      let orderIds = linked.map((order) => order.id);

      if (orderIds.length === 0) {
        const payments = await tx.payment.findMany({
          where: {
            transactionId: paymentIntentId,
            status: PaymentStatus.PENDING,
            order: { userId, status: OrderStatus.PENDING },
          },
          select: { orderId: true },
        });
        orderIds = [...new Set(payments.map((payment) => payment.orderId))];
      }

      if (orderIds.length > 0) {
        const items = await tx.orderItem.findMany({
          where: { orderId: { in: orderIds } },
          select: { variantId: true, quantity: true },
        });
        await adjustVariantStock(tx, items, 'release');
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }
    });
  }
}

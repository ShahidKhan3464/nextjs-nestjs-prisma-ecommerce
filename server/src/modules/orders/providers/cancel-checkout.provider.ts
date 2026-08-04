import { PrismaService } from 'src/prisma/prisma.service';
import { adjustVariantStock } from '../utils/adjust-variant-stock.util';
import {
  StripeClient,
  StripeService,
} from 'src/integrations/stripe/stripe.service';
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
} from '@nestjs/common';

@Injectable()
export class CancelCheckoutProvider {
  private readonly stripe: StripeClient;

  constructor(
    private readonly prisma: PrismaService,
    stripeService: StripeService,
  ) {
    this.stripe = stripeService.client;
  }

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

    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        throw new BadRequestException(
          'Payment already succeeded; complete checkout instead',
        );
      }

      if (paymentIntent.status !== 'canceled') {
        await this.stripe.paymentIntents.cancel(paymentIntentId).catch(() => {
          /* best-effort cancel */
        });
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      /* continue local cleanup if Stripe cancel fails */
    }

    await this.prisma.$transaction(async (tx) => {
      const payments = await tx.payment.findMany({
        where: {
          transactionId: paymentIntentId,
          status: PaymentStatus.PENDING,
          order: { userId, status: OrderStatus.PENDING },
        },
        select: { orderId: true },
      });

      const orderIds = payments.map((payment) => payment.orderId);
      if (orderIds.length > 0) {
        const items = await tx.orderItem.findMany({
          where: { orderId: { in: orderIds } },
          select: { variantId: true, quantity: true },
        });
        await adjustVariantStock(tx, items, 'release');
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }

      const updated = await tx.checkoutSession.updateMany({
        where: {
          id: session.id,
          status: CheckoutSessionStatus.PENDING,
        },
        data: { status: CheckoutSessionStatus.CANCELLED },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Checkout session is no longer pending');
      }
    });
  }
}

import Stripe from 'stripe';
import type { ConfigType } from '@nestjs/config';
import type { Stripe as StripeTypes } from 'stripe';
import stripeConfig from 'src/config/stripe.config';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  OrderStatus,
  PaymentStatus,
  CheckoutSessionStatus,
} from '../constants/order.constants';
import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class CancelCheckoutProvider {
  private stripe: StripeTypes;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(stripeConfig.KEY)
    private readonly stripeConfiguration: ConfigType<typeof stripeConfig>,
  ) {
    const secretKey = this.stripeConfiguration.secretKey;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(secretKey);
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

import Stripe from 'stripe';
import type { ConfigType } from '@nestjs/config';
import stripeConfig from 'src/config/stripe.config';
import type { Stripe as StripeTypes } from 'stripe';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/providers/mail.service';
import { CompleteCheckoutDto } from '../dto/complete-checkout.dto';
import { OrderResponse, mapOrderToResponse } from '../utils/map-order.util';
import { PaymentLifecycleProvider } from 'src/payments/providers/payment-lifecycle.provider';
import {
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
import {
  findOrdersWithImages,
  findCheckoutSessionWithImages,
} from 'src/common/files/file-query.util';

export type CompleteCheckoutResponse = {
  orders: OrderResponse[];
};

@Injectable()
export class CompleteCheckoutProvider {
  private stripe: StripeTypes;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly paymentLifecycleProvider: PaymentLifecycleProvider,
    @Inject(stripeConfig.KEY)
    private readonly stripeConfiguration: ConfigType<typeof stripeConfig>,
  ) {
    const secretKey = this.stripeConfiguration.secretKey;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(secretKey);
  }

  async complete(
    userId: number,
    dto: CompleteCheckoutDto,
  ): Promise<CompleteCheckoutResponse> {
    return this.completePaymentIntent(userId, dto.paymentIntentId);
  }

  /** Used by Stripe webhooks — trusts PaymentIntent metadata.userId. */
  async completeFromWebhook(
    paymentIntentId: string,
  ): Promise<CompleteCheckoutResponse> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(
      paymentIntentId,
    );
    const userId = Number(paymentIntent.metadata?.userId);
    if (!Number.isFinite(userId)) {
      throw new BadRequestException('Invalid checkout payment metadata');
    }
    return this.completePaymentIntent(userId, paymentIntentId);
  }

  private async completePaymentIntent(
    userId: number,
    paymentIntentId: string,
  ): Promise<CompleteCheckoutResponse> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(
      paymentIntentId,
      { expand: ['payment_method'] },
    );

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('Payment has not been completed');
    }

    if (paymentIntent.metadata?.userId !== String(userId)) {
      throw new ForbiddenException();
    }

    const sessionId = Number(paymentIntent.metadata?.checkoutSessionId);
    if (!Number.isFinite(sessionId)) {
      throw new BadRequestException('Invalid checkout session');
    }

    const existingPaid = await this.prisma.payment.findMany({
      where: {
        transactionId: paymentIntent.id,
        status: PaymentStatus.SUCCEEDED,
      },
      select: { orderId: true },
    });

    if (existingPaid.length > 0) {
      await this.prisma.cartItem.deleteMany({ where: { userId } });
      const orders = await this.loadOrders(
        existingPaid.map((payment) => payment.orderId),
      );
      const responses = orders.map((order) => mapOrderToResponse(order));
      await this.sendConfirmationEmails(userId, responses);
      return { orders: responses };
    }

    const session = await findCheckoutSessionWithImages(this.prisma, {
      id: sessionId,
      userId,
      status: CheckoutSessionStatus.PENDING,
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found or expired');
    }

    if (session.stripePaymentIntentId !== paymentIntent.id) {
      throw new BadRequestException('Payment does not match this checkout');
    }

    const expectedCents = Math.round(Number(session.totalAmount) * 100);
    if (
      paymentIntent.amount_received !== expectedCents ||
      paymentIntent.currency.toLowerCase() !== 'usd'
    ) {
      throw new BadRequestException('Payment amount mismatch');
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        transactionId: paymentIntent.id,
        status: PaymentStatus.PENDING,
        order: { userId, status: 'PENDING' },
      },
      include: {
        order: {
          include: { items: true },
        },
      },
    });

    if (payments.length === 0) {
      throw new NotFoundException('Pending orders not found for this checkout');
    }

    const paymentSummary = this.formatPaymentSummary(paymentIntent);
    const orderIds = payments.map((payment) => payment.orderId);

    await this.prisma.$transaction(async (tx) => {
      for (const payment of payments) {
        for (const item of payment.order.items) {
          await tx.$executeRaw`
            SELECT id FROM product_variants WHERE id = ${item.variantId} FOR UPDATE
          `;
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (!variant || variant.stockQuantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for variant ${item.variantId}`,
            );
          }

          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stockQuantity: variant.stockQuantity - item.quantity,
            },
          });
        }
      }

      await this.paymentLifecycleProvider.markSucceededMany(tx, {
        orderIds,
        methodSummary: paymentSummary,
      });

      await tx.checkoutSession.update({
        where: { id: session.id },
        data: { status: CheckoutSessionStatus.COMPLETED },
      });

      await tx.cartItem.deleteMany({ where: { userId } });
    });

    const created = await this.loadOrders(orderIds);
    const responses = created.map((order) => mapOrderToResponse(order));

    await this.sendConfirmationEmails(userId, responses);

    return { orders: responses };
  }

  private async sendConfirmationEmails(
    userId: number,
    orders: OrderResponse[],
  ): Promise<void> {
    const customer = await this.usersService.findOneById(userId);
    if (!customer?.email) return;

    for (const order of orders) {
      try {
        await this.mailService.sendOrderConfirmationEmail(
          customer.email,
          customer.fullName,
          order,
        );
      } catch {
        /* checkout must succeed even if email fails */
      }
    }
  }

  private async loadOrders(orderIds: number[]) {
    if (orderIds.length === 0) {
      throw new NotFoundException('Order not found');
    }

    const orders = await findOrdersWithImages(this.prisma, {
      where: { id: { in: orderIds } },
      orderBy: { id: 'asc' },
    });

    if (orders.length === 0) {
      throw new NotFoundException('Order not found');
    }

    return orders;
  }

  private formatPaymentSummary(
    paymentIntent: Awaited<
      ReturnType<StripeTypes['paymentIntents']['retrieve']>
    >,
  ): string {
    const pm = paymentIntent.payment_method;
    if (
      pm &&
      typeof pm === 'object' &&
      'card' in pm &&
      pm.card &&
      typeof pm.card === 'object'
    ) {
      const brand =
        'brand' in pm.card && typeof pm.card.brand === 'string'
          ? pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1)
          : 'Card';
      const last4 =
        'last4' in pm.card && typeof pm.card.last4 === 'string'
          ? pm.card.last4
          : '****';
      return `${brand} •••• ${last4}`;
    }
    return 'Card payment';
  }
}

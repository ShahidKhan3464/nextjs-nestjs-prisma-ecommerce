import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/modules/users/users.service';
import { CompleteCheckoutDto } from '../dto/complete-checkout.dto';
import { MailService } from 'src/integrations/mail/providers/mail.service';
import { OrderResponse, mapOrderToResponse } from '../utils/map-order.util';
import { NotificationService } from 'src/modules/notifications/notification.service';
import { NotificationType } from 'src/modules/notifications/constants/notification.constants';
import { PaymentLifecycleProvider } from 'src/modules/payments/providers/payment-lifecycle.provider';
import {
  StripeClient,
  StripeService,
} from 'src/integrations/stripe/stripe.service';
import {
  PaymentStatus,
  CheckoutSessionStatus,
} from '../constants/order.constants';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  findOrdersWithImages,
  findCheckoutSessionWithImages,
} from 'src/common/prisma/file-query.util';

export type CompleteCheckoutResponse = {
  orders: OrderResponse[];
};

@Injectable()
export class CompleteCheckoutProvider {
  private readonly stripe: StripeClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly notificationService: NotificationService,
    private readonly paymentLifecycleProvider: PaymentLifecycleProvider,
    stripeService: StripeService,
  ) {
    this.stripe = stripeService.client;
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
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);
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

    const alreadyCompleted = await this.loadCompletedOrdersForPaymentIntent(
      userId,
      paymentIntent.id,
    );
    if (alreadyCompleted) {
      return alreadyCompleted;
    }

    const session = await findCheckoutSessionWithImages(this.prisma, {
      id: sessionId,
      userId,
      status: CheckoutSessionStatus.PENDING,
    });

    if (!session) {
      // Another completer may have just finished — treat as idempotent success.
      const raced = await this.loadCompletedOrdersForPaymentIntent(
        userId,
        paymentIntent.id,
      );
      if (raced) {
        return raced;
      }
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
      const raced = await this.loadCompletedOrdersForPaymentIntent(
        userId,
        paymentIntent.id,
      );
      if (raced) {
        return raced;
      }
      throw new NotFoundException('Pending orders not found for this checkout');
    }

    const paymentSummary = this.formatPaymentSummary(paymentIntent);
    const orderIds = payments.map((payment) => payment.orderId);

    let claimed = false;

    await this.prisma.$transaction(async (tx) => {
      // Atomic claim: only one completer (client or webhook) wins.
      const claim = await tx.checkoutSession.updateMany({
        where: {
          id: session.id,
          status: CheckoutSessionStatus.PENDING,
        },
        data: { status: CheckoutSessionStatus.COMPLETED },
      });

      if (claim.count === 0) {
        return;
      }

      claimed = true;

      // Stock was reserved at checkout create — only mark payment succeeded here.
      await this.paymentLifecycleProvider.markSucceededMany(tx, {
        orderIds,
        methodSummary: paymentSummary,
      });

      await tx.cartItem.deleteMany({ where: { userId } });
    });

    if (!claimed) {
      const raced = await this.loadCompletedOrdersForPaymentIntent(
        userId,
        paymentIntent.id,
      );
      if (raced) {
        return raced;
      }
      throw new NotFoundException('Checkout session not found or expired');
    }

    const created = await this.loadOrders(orderIds);
    const responses = created.map((order) => mapOrderToResponse(order));

    await this.sendConfirmationEmails(userId, responses);
    this.notifyOrdersCreated(userId, responses);

    return { orders: responses };
  }

  private notifyOrdersCreated(userId: number, orders: OrderResponse[]): void {
    for (const order of orders) {
      void this.notificationService
        .create({
          userId,
          type: NotificationType.ORDER_CREATED,
          title: 'Order placed',
          message: `Your order #${order.id} was placed successfully.`,
        })
        .catch(() => undefined);
    }
  }

  private async loadCompletedOrdersForPaymentIntent(
    userId: number,
    paymentIntentId: string,
  ): Promise<CompleteCheckoutResponse | null> {
    const existingPaid = await this.prisma.payment.findMany({
      where: {
        transactionId: paymentIntentId,
        status: PaymentStatus.SUCCEEDED,
      },
      select: { orderId: true },
    });

    if (existingPaid.length === 0) {
      return null;
    }

    await this.prisma.cartItem.deleteMany({ where: { userId } });
    const orders = await this.loadOrders(
      existingPaid.map((payment) => payment.orderId),
    );
    const responses = orders.map((order) => mapOrderToResponse(order));
    // Idempotent path — do not re-send confirmation emails.
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
      ReturnType<StripeClient['paymentIntents']['retrieve']>
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

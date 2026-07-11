import Stripe from 'stripe';
import type { ConfigType } from '@nestjs/config';
import stripeConfig from 'src/config/stripe.config';
import type { Stripe as StripeTypes } from 'stripe';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/providers/mail.service';
import { CompleteCheckoutDto } from '../dto/complete-checkout.dto';
import { OrderStatus, PaymentStatus } from '../constants/order.constants';
import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  findOrderWithImages,
  findCheckoutSessionWithImages,
} from 'src/common/files/file-query.util';
import {
  OrderResponse,
  mapOrderToResponse,
  generateOrderNumber,
} from '../utils/map-order.util';

@Injectable()
export class CompleteCheckoutProvider {
  private stripe: StripeTypes;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
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
  ): Promise<OrderResponse> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(
      dto.paymentIntentId,
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

    const existingOrder = await this.prisma.order.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });
    if (existingOrder) {
      const full = await this.loadOrder(existingOrder.id);
      const response = mapOrderToResponse(full);
      await this.sendConfirmationEmail(existingOrder.userId, response);
      return response;
    }

    const session = await findCheckoutSessionWithImages(this.prisma, {
      id: sessionId,
      userId,
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found or expired');
    }

    if (session.stripePaymentIntentId !== paymentIntent.id) {
      throw new BadRequestException('Payment does not match this checkout');
    }

    const expectedCents = Math.round(Number(session.totalAmount) * 100);
    if (paymentIntent.amount_received < expectedCents) {
      throw new BadRequestException('Payment amount mismatch');
    }

    const paymentSummary = this.formatPaymentSummary(paymentIntent);
    const orderNumber = generateOrderNumber();

    const orderId = await this.prisma.$transaction(async (tx) => {
      for (const item of session.items) {
        await tx.$executeRaw`
          SELECT id FROM product_variants WHERE id = ${item.variantId} FOR UPDATE
        `;
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (!variant || variant.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for variant ${item.variantId}`,
          );
        }

        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: variant.stock - item.quantity },
        });
      }

      const savedOrder = await tx.order.create({
        data: {
          userId,
          orderNumber,
          tax: session.tax,
          subtotal: session.subtotal,
          status: OrderStatus.PENDING,
          totalAmount: session.totalAmount,
          paymentStatus: PaymentStatus.PAID,
          paymentMethodSummary: paymentSummary,
          stripePaymentIntentId: paymentIntent.id,
          shippingAddress: session.shippingAddress,
        },
      });

      await tx.orderItem.createMany({
        data: session.items.map((sessionItem) => ({
          orderId: savedOrder.id,
          quantity: sessionItem.quantity,
          variantId: sessionItem.variantId,
          priceAtPurchase: sessionItem.priceAtPurchase,
          imageUrl: sessionItem.variant?.product?.images?.[0]?.urlPath ?? null,
        })),
      });

      await tx.cartItem.deleteMany({ where: { userId } });
      await tx.checkoutSession.delete({ where: { id: session.id } });

      return savedOrder.id;
    });

    const created = await this.loadOrder(orderId);
    const response = mapOrderToResponse(created);

    await this.sendConfirmationEmail(userId, response);

    return response;
  }

  private async sendConfirmationEmail(
    userId: number,
    order: OrderResponse,
  ): Promise<void> {
    const customer = await this.usersService.findOneById(userId);
    if (!customer?.email) return;

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

  private async loadOrder(orderId: number) {
    const order = await findOrderWithImages(this.prisma, { id: orderId });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
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

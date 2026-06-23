import Stripe from 'stripe';
import type { ConfigType } from '@nestjs/config';
import { Order } from '../entities/order.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import stripeConfig from 'src/config/stripe.config';
import type { Stripe as StripeTypes } from 'stripe';
import { UsersService } from 'src/users/users.service';
import { OrderItem } from '../entities/order-item.entity';
import { CartItem } from 'src/cart/entities/cart-item.entity';
import { MailService } from 'src/mail/providers/mail.service';
import { CompleteCheckoutDto } from '../dto/complete-checkout.dto';
import { joinProductImages } from 'src/common/files/file-query.util';
import { CheckoutSession } from '../entities/checkout-session.entity';
import { OrderStatus, PaymentStatus } from '../constants/order.constants';
import { ProductVariant } from 'src/products/entities/product-variant.entity';
import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  OrderResponse,
  mapOrderToResponse,
  generateOrderNumber,
} from '../utils/map-order.util';

@Injectable()
export class CompleteCheckoutProvider {
  private stripe: StripeTypes;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(CheckoutSession)
    private readonly sessionRepository: Repository<CheckoutSession>,
    private readonly dataSource: DataSource,
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

    const existingOrder = await this.orderRepository.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
    });
    if (existingOrder) {
      const full = await this.loadOrder(existingOrder.id);
      const response = mapOrderToResponse(full);
      await this.sendConfirmationEmail(existingOrder.userId, response);
      return response;
    }

    const session = await joinProductImages(
      this.sessionRepository
        .createQueryBuilder('session')
        .leftJoinAndSelect('session.items', 'items')
        .leftJoinAndSelect('items.variant', 'variant')
        .leftJoinAndSelect('variant.product', 'product')
        .withDeleted()
        .where('session.id = :sessionId', { sessionId })
        .andWhere('session.userId = :userId', { userId }),
      'product',
    ).getOne();

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

    const orderId = await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const itemRepo = manager.getRepository(OrderItem);
      const variantRepo = manager.getRepository(ProductVariant);
      const cartRepo = manager.getRepository(CartItem);
      const sessionRepo = manager.getRepository(CheckoutSession);

      for (const item of session.items) {
        const variant = await variantRepo
          .createQueryBuilder('variant')
          .setLock('pessimistic_write')
          .where('variant.id = :id', { id: item.variantId })
          .getOne();

        if (!variant || variant.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for variant ${item.variantId}`,
          );
        }
        variant.stock -= item.quantity;
        await variantRepo.save(variant);
      }

      const order = orderRepo.create({
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
      });

      const savedOrder = await orderRepo.save(order);

      const orderItems = session.items.map((sessionItem) => {
        const imageUrl =
          sessionItem.variant?.product?.images?.[0]?.urlPath ?? null;
        return itemRepo.create({
          orderId: savedOrder.id,
          variantId: sessionItem.variantId,
          quantity: sessionItem.quantity,
          priceAtPurchase: sessionItem.priceAtPurchase,
          imageUrl,
        });
      });

      await itemRepo.save(orderItems);
      await cartRepo.delete({ userId });
      await sessionRepo.remove(session);

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

  private async loadOrder(orderId: number): Promise<Order> {
    return joinProductImages(
      this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.user', 'user')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.variant', 'variant')
        .leftJoinAndSelect('variant.product', 'product')
        .withDeleted()
        .where('order.id = :orderId', { orderId }),
      'product',
    ).getOneOrFail();
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

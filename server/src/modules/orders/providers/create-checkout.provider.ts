import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateOrderNumber } from '../utils/map-order.util';
import { CreateCheckoutDto } from '../dto/create-checkout.dto';
import { calculateOrderPricing } from '../utils/order-pricing.util';
import { lockProductVariants } from '../utils/lock-product-variants.util';
import { findCartItemsWithImages } from 'src/common/prisma/file-query.util';
import {
  StripeClient,
  StripeService,
} from 'src/integrations/stripe/stripe.service';
import { validateAndGroupCheckoutCart } from '../utils/validate-checkout-cart.util';
import {
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
  CheckoutSessionStatus,
} from '../constants/order.constants';

type CheckoutPreview = {
  tax: number;
  total: number;
  subtotal: number;
};

export type CheckoutSessionResponse = {
  clientSecret: string;
  paymentIntentId: string;
  preview: CheckoutPreview;
  checkoutSessionId: string;
  orderIds: string[];
};

@Injectable()
export class CreateCheckoutProvider {
  private readonly stripe: StripeClient;

  constructor(
    private readonly prisma: PrismaService,
    stripeService: StripeService,
  ) {
    this.stripe = stripeService.client;
  }

  async create(
    userId: number,
    dto: CreateCheckoutDto,
  ): Promise<CheckoutSessionResponse> {
    await this.clearAbandonedCheckout(userId);

    const cartItems = await findCartItemsWithImages(this.prisma, { userId });
    const storeGroups = validateAndGroupCheckoutCart(cartItems);

    const checkoutSubtotal = storeGroups.reduce(
      (sum, group) => sum + group.subtotal,
      0,
    );
    const pricing = calculateOrderPricing(checkoutSubtotal);
    const amountCents = Math.round(pricing.total * 100);

    if (amountCents < 50) {
      throw new BadRequestException(
        'Order total is too low to process payment',
      );
    }

    const shippingAddressJson = JSON.stringify(dto.shippingAddress);
    const allLines = storeGroups.flatMap((group) => group.lines);

    const { sessionId, orderIds } = await this.prisma.$transaction(
      async (tx) => {
        const variantIds = allLines.map((line) => line.variantId);
        await lockProductVariants(tx, variantIds);

        const lockedVariants = await tx.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: {
            id: true,
            sku: true,
            stockQuantity: true,
            product: {
              select: {
                deletedAt: true,
                status: true,
                store: {
                  select: {
                    deletedAt: true,
                    status: true,
                    sellerProfile: {
                      select: { deletedAt: true },
                    },
                  },
                },
              },
            },
          },
        });
        const variantById = new Map(lockedVariants.map((v) => [v.id, v]));

        for (const line of allLines) {
          const variant = variantById.get(line.variantId);

          if (!variant) {
            throw new BadRequestException(
              `Variant not found for id ${line.variantId}`,
            );
          }

          if (line.quantity <= 0) {
            throw new BadRequestException('Invalid quantity');
          }

          if (variant.stockQuantity < line.quantity) {
            throw new BadRequestException(
              `Insufficient stock for ${variant.sku}`,
            );
          }

          const product = variant.product;
          if (
            !product ||
            product.deletedAt ||
            product.status !== 'ACTIVE' ||
            !product.store ||
            product.store.deletedAt ||
            product.store.status !== 'ACTIVE' ||
            !product.store.sellerProfile ||
            product.store.sellerProfile.deletedAt
          ) {
            throw new BadRequestException('Product unavailable');
          }
        }

        const createdSession = await tx.checkoutSession.create({
          data: {
            userId,
            tax: pricing.tax,
            totalAmount: pricing.total,
            subtotal: pricing.subtotal,
            status: CheckoutSessionStatus.PENDING,
            stripePaymentIntentId: 'pending',
            shippingAddress: shippingAddressJson,
          },
        });

        await tx.checkoutSessionItem.createMany({
          data: allLines.map((line) => ({
            checkoutSessionId: createdSession.id,
            variantId: line.variantId,
            quantity: line.quantity,
            priceAtPurchase: line.unitPrice,
          })),
        });

        const createdOrderIds: number[] = [];

        for (const group of storeGroups) {
          const orderPricing = calculateOrderPricing(group.subtotal);
          const orderNumber = generateOrderNumber();

          const order = await tx.order.create({
            data: {
              userId,
              orderNumber,
              tax: orderPricing.tax,
              storeId: group.storeId,
              status: OrderStatus.PENDING,
              subtotal: orderPricing.subtotal,
              totalAmount: orderPricing.total,
              shippingAddress: shippingAddressJson,
              items: {
                create: group.lines.map((line) => ({
                  variantId: line.variantId,
                  quantity: line.quantity,
                  productName: line.productName,
                  variantSku: line.variantSku,
                  variantColor: line.variantColor,
                  variantSize: line.variantSize,
                  priceAtPurchase: line.unitPrice,
                  productImageUrl: line.productImageUrl,
                })),
              },
              payment: {
                create: {
                  provider: PaymentProvider.STRIPE,
                  amount: orderPricing.total,
                  currency: 'usd',
                  status: PaymentStatus.PENDING,
                  transactionId: 'pending',
                },
              },
            },
          });

          createdOrderIds.push(order.id);
        }

        return {
          sessionId: createdSession.id,
          orderIds: createdOrderIds,
        };
      },
    );

    let paymentIntent: Awaited<
      ReturnType<StripeClient['paymentIntents']['create']>
    >;
    try {
      paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: false },
        payment_method_types: ['card'],
        metadata: {
          checkoutSessionId: String(sessionId),
          userId: String(userId),
        },
      });
    } catch {
      await this.rollbackCheckout(sessionId, orderIds);
      throw new BadRequestException('Failed to initialize payment');
    }

    if (!paymentIntent.client_secret) {
      await this.rollbackCheckout(sessionId, orderIds);
      throw new BadRequestException('Failed to initialize payment');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.checkoutSession.update({
        where: { id: sessionId },
        data: { stripePaymentIntentId: paymentIntent.id },
      });

      await tx.payment.updateMany({
        where: { orderId: { in: orderIds } },
        data: { transactionId: paymentIntent.id },
      });
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      checkoutSessionId: String(sessionId),
      orderIds: orderIds.map(String),
      preview: {
        tax: pricing.tax,
        total: pricing.total,
        subtotal: pricing.subtotal,
      },
    };
  }

  private async clearAbandonedCheckout(userId: number): Promise<void> {
    const existingSessions = await this.prisma.checkoutSession.findMany({
      where: {
        userId,
        status: CheckoutSessionStatus.PENDING,
      },
      select: { id: true, stripePaymentIntentId: true },
    });

    if (existingSessions.length === 0) {
      return;
    }

    const protectedSessionIds = new Set<number>();

    for (const session of existingSessions) {
      const piId = session.stripePaymentIntentId;
      if (!piId || piId === 'pending') {
        continue;
      }

      try {
        const paymentIntent = await this.stripe.paymentIntents.retrieve(piId);
        if (
          paymentIntent.status === 'succeeded' ||
          paymentIntent.status === 'processing'
        ) {
          // Do not delete orders that may already be paid — leave for complete/webhook.
          protectedSessionIds.add(session.id);
          continue;
        }

        if (
          paymentIntent.status === 'requires_payment_method' ||
          paymentIntent.status === 'requires_confirmation' ||
          paymentIntent.status === 'requires_action' ||
          paymentIntent.status === 'requires_capture'
        ) {
          await this.stripe.paymentIntents.cancel(piId).catch(() => undefined);
        }
      } catch {
        /* continue cleanup for unreachable PI lookups */
      }
    }

    const sessionsToExpire = existingSessions.filter(
      (session) => !protectedSessionIds.has(session.id),
    );

    if (sessionsToExpire.length === 0) {
      return;
    }

    const transactionIds = sessionsToExpire
      .map((session) => session.stripePaymentIntentId)
      .filter((id) => id && id !== 'pending');

    await this.prisma.$transaction(async (tx) => {
      const pendingPayments = await tx.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          order: { userId, status: OrderStatus.PENDING },
          OR: [
            ...(transactionIds.length > 0
              ? [{ transactionId: { in: transactionIds } }]
              : []),
            { transactionId: 'pending' },
          ],
        },
        select: { orderId: true },
      });

      const orderIds = [...new Set(pendingPayments.map((p) => p.orderId))];
      if (orderIds.length > 0) {
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }

      await tx.checkoutSession.updateMany({
        where: {
          id: { in: sessionsToExpire.map((session) => session.id) },
          status: CheckoutSessionStatus.PENDING,
        },
        data: { status: CheckoutSessionStatus.EXPIRED },
      });
    });
  }

  private async rollbackCheckout(
    sessionId: number,
    orderIds: number[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (orderIds.length > 0) {
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      await tx.checkoutSession.update({
        where: { id: sessionId },
        data: { status: CheckoutSessionStatus.CANCELLED },
      });
    });
  }
}

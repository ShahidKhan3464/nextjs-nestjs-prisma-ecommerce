import Stripe from 'stripe';
import type { ConfigType } from '@nestjs/config';
import type { Stripe as StripeTypes } from 'stripe';
import stripeConfig from 'src/config/stripe.config';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateOrderNumber } from '../utils/map-order.util';
import { CreateCheckoutDto } from '../dto/create-checkout.dto';
import { calculateOrderPricing } from '../utils/order-pricing.util';
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { findCartItemsWithImages } from 'src/common/files/file-query.util';
import { validateAndGroupCheckoutCart } from '../utils/validate-checkout-cart.util';
import {
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
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
        for (const line of allLines) {
          await tx.$executeRaw`
            SELECT id FROM product_variants WHERE id = ${line.variantId} FOR UPDATE
          `;
          const variant = await tx.productVariant.findUnique({
            where: { id: line.variantId },
            include: {
              product: {
                include: {
                  store: {
                    include: { sellerProfile: true },
                  },
                },
              },
            },
          });

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
      ReturnType<StripeTypes['paymentIntents']['create']>
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

      await tx.cartItem.deleteMany({ where: { userId } });
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
      where: { userId },
      select: { id: true, stripePaymentIntentId: true },
    });

    const transactionIds = existingSessions
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

      if (existingSessions.length > 0) {
        await tx.checkoutSession.deleteMany({ where: { userId } });
      }
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
      await tx.checkoutSession
        .delete({ where: { id: sessionId } })
        .catch(() => {
          /* session may already be gone */
        });
    });
  }
}

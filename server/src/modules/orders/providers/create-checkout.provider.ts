import { PrismaService } from 'src/prisma/prisma.service';
import { generateOrderNumber } from '../utils/map-order.util';
import { CreateCheckoutDto } from '../dto/create-checkout.dto';
import { Injectable, BadRequestException } from '@nestjs/common';
import { calculateOrderPricing } from '../utils/order-pricing.util';
import type { CheckoutSessionResponse } from '../types/order.types';
import { lockProductVariants } from '../utils/lock-product-variants.util';
import { StoreStatus } from 'src/modules/stores/constants/store.constants';
import { findCartItemsWithImages } from 'src/common/prisma/file-query.util';
import { normalizeIdempotencyKey } from '../utils/checkout-idempotency.util';
import { CheckoutIdempotencyProvider } from './checkout-idempotency.provider';
import { ProductStatus } from 'src/modules/products/constants/product.constants';
import { validateAndGroupCheckoutCart } from '../utils/validate-checkout-cart.util';
import { ExpireAbandonedCheckoutsProvider } from './expire-abandoned-checkouts.provider';
import { assertNotOwnStorePurchase } from 'src/common/utils/assert-not-own-store-purchase.util';
import {
  type StockLine,
  adjustVariantStock,
} from '../utils/adjust-variant-stock.util';
import {
  StripeService,
  type StripePaymentIntent,
} from 'src/integrations/stripe';
import {
  OrderStatus,
  PaymentStatus,
  PaymentProvider,
  CHECKOUT_CURRENCY,
  CheckoutSessionStatus,
} from '../constants/order.constants';

@Injectable()
export class CreateCheckoutProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly checkoutIdempotency: CheckoutIdempotencyProvider,
    private readonly expireAbandonedCheckouts: ExpireAbandonedCheckoutsProvider,
  ) {}

  async create(
    userId: number,
    dto: CreateCheckoutDto,
    idempotencyKeyHeader?: string,
  ): Promise<CheckoutSessionResponse> {
    const key = normalizeIdempotencyKey(
      dto.idempotencyKey ?? idempotencyKeyHeader,
    );

    if (!key) {
      return this.createOnce(userId, dto);
    }

    const requestHash = this.checkoutIdempotency.hashRequest(
      dto.shippingAddress,
    );
    const existing = await this.checkoutIdempotency.begin(
      userId,
      key,
      requestHash,
    );
    if (existing !== 'proceed') {
      return existing;
    }

    try {
      const response = await this.createOnce(userId, dto, key);
      try {
        await this.checkoutIdempotency.complete(userId, key, response);
      } catch {
        /* Checkout already exists; do not abort or a retry can create another. */
      }
      return response;
    } catch (err) {
      await this.checkoutIdempotency.abort(userId, key);
      throw err;
    }
  }

  private async createOnce(
    userId: number,
    dto: CreateCheckoutDto,
    idempotencyKey?: string,
  ): Promise<CheckoutSessionResponse> {
    await this.expireAbandonedCheckouts.clearForUser(userId);

    const cartItems = await findCartItemsWithImages(this.prisma, { userId });
    const storeGroups = validateAndGroupCheckoutCart(cartItems, userId);

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
                      select: { deletedAt: true, userId: true },
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
            product.status !== ProductStatus.ACTIVE ||
            !product.store ||
            product.store.deletedAt ||
            product.store.status !== StoreStatus.ACTIVE ||
            !product.store.sellerProfile ||
            product.store.sellerProfile.deletedAt
          ) {
            throw new BadRequestException('Product unavailable');
          }

          assertNotOwnStorePurchase(userId, product.store.sellerProfile.userId);
        }

        const stockLines: StockLine[] = allLines.map((line) => ({
          variantId: line.variantId,
          quantity: line.quantity,
        }));
        await adjustVariantStock(tx, stockLines, 'reserve');

        const createdSession = await tx.checkoutSession.create({
          data: {
            userId,
            tax: pricing.tax,
            totalAmount: pricing.total,
            subtotal: pricing.subtotal,
            stripePaymentIntentId: 'pending',
            shippingAddress: shippingAddressJson,
            status: CheckoutSessionStatus.PENDING,
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
              checkoutSessionId: createdSession.id,
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
                  currency: CHECKOUT_CURRENCY,
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

    const stripeIdempotencyKey = idempotencyKey
      ? `checkout:${userId}:${idempotencyKey}`
      : `checkout-session:${sessionId}`;

    let paymentIntent: StripePaymentIntent;
    try {
      paymentIntent = await this.stripeService.createPaymentIntent(
        {
          amount: amountCents,
          currency: CHECKOUT_CURRENCY,
          automatic_payment_methods: { enabled: false },
          payment_method_types: ['card'],
          metadata: {
            checkoutSessionId: String(sessionId),
            userId: String(userId),
          },
        },
        { idempotencyKey: stripeIdempotencyKey },
      );
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

  private async rollbackCheckout(
    sessionId: number,
    orderIds: number[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (orderIds.length > 0) {
        const items = await tx.orderItem.findMany({
          where: { orderId: { in: orderIds } },
          select: { variantId: true, quantity: true },
        });
        await adjustVariantStock(tx, items, 'release');
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      await tx.checkoutSession.update({
        where: { id: sessionId },
        data: { status: CheckoutSessionStatus.CANCELLED },
      });
    });
  }
}

import Stripe from 'stripe';
import type { ConfigType } from '@nestjs/config';
import type { Stripe as StripeTypes } from 'stripe';
import stripeConfig from 'src/config/stripe.config';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCheckoutDto } from '../dto/create-checkout.dto';
import { calculateOrderPricing } from '../utils/order-pricing.util';
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { findCartItemsWithImages } from 'src/common/files/file-query.util';

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
    const existingSessions = await this.prisma.checkoutSession.findMany({
      where: { userId },
    });
    if (existingSessions.length > 0) {
      await this.prisma.checkoutSession.deleteMany({ where: { userId } });
    }

    const cartItems = await findCartItemsWithImages(this.prisma, { userId });

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    let subtotal = 0;
    for (const item of cartItems) {
      subtotal += Number(item.variant.price) * item.quantity;
    }

    const pricing = calculateOrderPricing(subtotal);
    const amountCents = Math.round(pricing.total * 100);

    if (amountCents < 50) {
      throw new BadRequestException(
        'Order total is too low to process payment',
      );
    }

    const shippingAddressJson = JSON.stringify(dto.shippingAddress);

    const savedSession = await this.prisma.$transaction(async (tx) => {
      for (const item of cartItems) {
        await tx.$executeRaw`
          SELECT id FROM product_variants WHERE id = ${item.productVariantId} FOR UPDATE
        `;
        const variant = await tx.productVariant.findUnique({
          where: { id: item.productVariantId },
        });

        if (!variant || item.quantity > variant.stock) {
          throw new BadRequestException(
            `Insufficient stock for ${item.variant.sku}`,
          );
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
        data: cartItems.map((cartItem) => ({
          checkoutSessionId: createdSession.id,
          variantId: cartItem.productVariantId,
          quantity: cartItem.quantity,
          priceAtPurchase: Number(cartItem.variant.price),
        })),
      });

      return createdSession;
    });

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: false },
      payment_method_types: ['card'],
      metadata: {
        checkoutSessionId: String(savedSession.id),
        userId: String(userId),
      },
    });

    if (!paymentIntent.client_secret) {
      await this.prisma.checkoutSession.delete({
        where: { id: savedSession.id },
      });
      throw new BadRequestException('Failed to initialize payment');
    }

    await this.prisma.checkoutSession.update({
      where: { id: savedSession.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      checkoutSessionId: String(savedSession.id),
      preview: {
        tax: pricing.tax,
        total: pricing.total,
        subtotal: pricing.subtotal,
      },
    };
  }
}

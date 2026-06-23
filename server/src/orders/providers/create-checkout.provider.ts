import Stripe from 'stripe';
import { DataSource, Repository } from 'typeorm';
import type { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { Stripe as StripeTypes } from 'stripe';
import stripeConfig from 'src/config/stripe.config';
import { CartItem } from 'src/cart/entities/cart-item.entity';
import { CreateCheckoutDto } from '../dto/create-checkout.dto';
import { calculateOrderPricing } from '../utils/order-pricing.util';
import { joinProductImages } from 'src/common/files/file-query.util';
import { CheckoutSession } from '../entities/checkout-session.entity';
import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { ProductVariant } from 'src/products/entities/product-variant.entity';
import { CheckoutSessionItem } from '../entities/checkout-session-item.entity';

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
    @InjectRepository(CheckoutSession)
    private readonly sessionRepository: Repository<CheckoutSession>,
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    private readonly dataSource: DataSource,
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
    const existingSessions = await this.sessionRepository.find({
      where: { userId },
    });
    if (existingSessions.length > 0) {
      await this.sessionRepository.remove(existingSessions);
    }

    const cartItems = await joinProductImages(
      this.cartRepository
        .createQueryBuilder('cart')
        .where('cart.userId = :userId', { userId })
        .innerJoinAndSelect('cart.variant', 'variant')
        .innerJoinAndSelect('variant.product', 'product'),
      'product',
    ).getMany();

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

    const savedSession = await this.dataSource.transaction(async (manager) => {
      const sessionRepo = manager.getRepository(CheckoutSession);
      const itemRepo = manager.getRepository(CheckoutSessionItem);
      const variantRepo = manager.getRepository(ProductVariant);

      for (const item of cartItems) {
        const variant = await variantRepo
          .createQueryBuilder('variant')
          .setLock('pessimistic_write')
          .where('variant.id = :id', { id: item.productVariantId })
          .getOne();

        if (!variant || item.quantity > variant.stock) {
          throw new BadRequestException(
            `Insufficient stock for ${item.variant.sku}`,
          );
        }
      }

      const session = sessionRepo.create({
        userId,
        tax: pricing.tax,
        totalAmount: pricing.total,
        subtotal: pricing.subtotal,
        stripePaymentIntentId: 'pending',
        shippingAddress: shippingAddressJson,
      });

      const createdSession = await sessionRepo.save(session);

      const lineItems = cartItems.map((cartItem) =>
        itemRepo.create({
          checkoutSessionId: createdSession.id,
          variantId: cartItem.productVariantId,
          quantity: cartItem.quantity,
          priceAtPurchase: Number(cartItem.variant.price),
        }),
      );

      await itemRepo.save(lineItems);
      createdSession.items = lineItems;
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
      await this.sessionRepository.remove(savedSession);
      throw new BadRequestException('Failed to initialize payment');
    }

    savedSession.stripePaymentIntentId = paymentIntent.id;
    await this.sessionRepository.save(savedSession);

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

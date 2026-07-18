import Stripe from 'stripe';
import type { ConfigType } from '@nestjs/config';
import stripeConfig from 'src/config/stripe.config';
import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CompleteCheckoutProvider } from './complete-checkout.provider';

@Injectable()
export class StripeWebhookProvider {
  private readonly logger = new Logger(StripeWebhookProvider.name);
  private stripe: Stripe;

  constructor(
    private readonly completeCheckoutProvider: CompleteCheckoutProvider,
    @Inject(stripeConfig.KEY)
    private readonly stripeConfiguration: ConfigType<typeof stripeConfig>,
  ) {
    const secretKey = this.stripeConfiguration.secretKey;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(secretKey);
  }

  public async handle(
    rawBody: Buffer,
    signature: string | undefined,
  ): Promise<{ received: true }> {
    const webhookSecret = this.stripeConfiguration.webhookSecret;
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook is not configured');
    }

    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Stripe webhook signature verification failed: ${detail}`,
      );
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      try {
        await this.completeCheckoutProvider.completeFromWebhook(
          paymentIntent.id,
        );
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Webhook checkout completion failed for ${paymentIntent.id}: ${detail}`,
        );
      }
    }

    return { received: true };
  }
}

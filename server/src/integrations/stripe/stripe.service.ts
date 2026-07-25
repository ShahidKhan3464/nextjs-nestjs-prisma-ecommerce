import Stripe from 'stripe';
import type { ConfigType } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';
import stripeConfig from 'src/config/stripe.config';

/** Stripe SDK client type — import this instead of `stripe` outside the integration layer. */
export type StripeClient = Stripe;
export type StripeEvent = Stripe.Event;
export type StripePaymentIntent = Stripe.PaymentIntent;

/**
 * Single shared Stripe SDK client for the application.
 * Business workflows (checkout, refunds, webhooks) stay in domain modules.
 */
@Injectable()
export class StripeService {
  /** Shared Stripe SDK instance — same construction as the previous per-provider clients. */
  readonly client: StripeClient;
  /** Webhook signing secret from config (may be empty outside production). */
  readonly webhookSecret: string | undefined;

  constructor(
    @Inject(stripeConfig.KEY)
    stripeConfiguration: ConfigType<typeof stripeConfig>,
  ) {
    const secretKey = stripeConfiguration.secretKey;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.client = new Stripe(secretKey);
    this.webhookSecret = stripeConfiguration.webhookSecret;
  }
}

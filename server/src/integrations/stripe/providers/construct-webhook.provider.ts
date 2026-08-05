import { Inject, Injectable } from '@nestjs/common';
import type { StripeClient, StripeEvent } from '../types/stripe.types';
import {
  STRIPE_CLIENT,
  STRIPE_WEBHOOK_SECRET,
} from '../constants/stripe.constants';

@Injectable()
export class ConstructWebhookProvider {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: StripeClient,
    @Inject(STRIPE_WEBHOOK_SECRET)
    private readonly webhookSecret: string | undefined,
  ) {}

  get webhookSigningSecret(): string | undefined {
    return this.webhookSecret;
  }

  execute(rawBody: Buffer, signature: string): StripeEvent {
    if (!this.webhookSecret) {
      throw new Error('Stripe webhook secret is not configured');
    }
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );
  }
}

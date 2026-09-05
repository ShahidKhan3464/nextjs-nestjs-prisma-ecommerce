import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_CLIENT } from '../constants/stripe.constants';
import type { StripeClient, StripePaymentIntent } from '../types/stripe.types';

@Injectable()
export class CancelPaymentProvider {
  constructor(@Inject(STRIPE_CLIENT) private readonly stripe: StripeClient) {}

  execute(paymentIntentId: string): Promise<StripePaymentIntent> {
    return this.stripe.paymentIntents.cancel(paymentIntentId);
  }
}

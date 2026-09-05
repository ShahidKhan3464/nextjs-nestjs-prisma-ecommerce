import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_CLIENT } from '../constants/stripe.constants';
import type {
  StripeClient,
  StripePaymentIntent,
  CreatePaymentIntentParams,
  CreatePaymentIntentRequestOptions,
} from '../types/stripe.types';

@Injectable()
export class CreatePaymentIntentProvider {
  constructor(@Inject(STRIPE_CLIENT) private readonly stripe: StripeClient) {}

  execute(
    params: CreatePaymentIntentParams,
    options?: CreatePaymentIntentRequestOptions,
  ): Promise<StripePaymentIntent> {
    return this.stripe.paymentIntents.create(params, options);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { STRIPE_CLIENT } from '../constants/stripe.constants';
import type {
  StripeClient,
  StripeRefund,
  CreateRefundParams,
  CreateRefundRequestOptions,
} from '../types/stripe.types';

@Injectable()
export class RefundPaymentProvider {
  constructor(@Inject(STRIPE_CLIENT) private readonly stripe: StripeClient) {}

  execute(
    params: CreateRefundParams,
    options?: CreateRefundRequestOptions,
  ): Promise<StripeRefund> {
    return this.stripe.refunds.create(params, options);
  }
}

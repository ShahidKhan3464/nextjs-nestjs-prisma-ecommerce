import { Injectable } from '@nestjs/common';
import { CancelPaymentProvider } from './providers/cancel-payment.provider';
import { RefundPaymentProvider } from './providers/refund-payment.provider';
import { RetrievePaymentProvider } from './providers/retrieve-payment.provider';
import { ConstructWebhookProvider } from './providers/construct-webhook.provider';
import { CreatePaymentIntentProvider } from './providers/create-payment-intent.provider';
import type {
  StripeEvent,
  StripeRefund,
  CreateRefundParams,
  StripePaymentIntent,
  CreatePaymentIntentParams,
  CreateRefundRequestOptions,
  RetrievePaymentIntentParams,
  CreatePaymentIntentRequestOptions,
} from './types/stripe.types';

/**
 * Stripe integration facade. Domain modules call these methods;
 * SDK construction and low-level calls live in providers/.
 */
@Injectable()
export class StripeService {
  constructor(
    private readonly createPaymentIntentProvider: CreatePaymentIntentProvider,
    private readonly retrievePaymentProvider: RetrievePaymentProvider,
    private readonly cancelPaymentProvider: CancelPaymentProvider,
    private readonly refundPaymentProvider: RefundPaymentProvider,
    private readonly constructWebhookProvider: ConstructWebhookProvider,
  ) {}

  /** Webhook signing secret from config (may be empty outside production). */
  get webhookSecret(): string | undefined {
    return this.constructWebhookProvider.webhookSigningSecret;
  }

  createPaymentIntent(
    params: CreatePaymentIntentParams,
    options?: CreatePaymentIntentRequestOptions,
  ): Promise<StripePaymentIntent> {
    return this.createPaymentIntentProvider.execute(params, options);
  }

  retrievePaymentIntent(
    paymentIntentId: string,
    params?: RetrievePaymentIntentParams,
  ): Promise<StripePaymentIntent> {
    return this.retrievePaymentProvider.execute(paymentIntentId, params);
  }

  cancelPaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
    return this.cancelPaymentProvider.execute(paymentIntentId);
  }

  createRefund(
    params: CreateRefundParams,
    options?: CreateRefundRequestOptions,
  ): Promise<StripeRefund> {
    return this.refundPaymentProvider.execute(params, options);
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): StripeEvent {
    return this.constructWebhookProvider.execute(rawBody, signature);
  }
}

import { CompleteCheckoutProvider } from './complete-checkout.provider';
import { StripeService, type StripeEvent } from 'src/integrations/stripe';
import { isPermanentCompletionFailure } from '../utils/stripe-webhook.util';
import { HandlePaymentFailedProvider } from './handle-payment-failed.provider';
import {
  Logger,
  Injectable,
  HttpException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class StripeWebhookProvider {
  private readonly logger = new Logger(StripeWebhookProvider.name);

  constructor(
    private readonly completeCheckoutProvider: CompleteCheckoutProvider,
    private readonly handlePaymentFailed: HandlePaymentFailedProvider,
    private readonly stripeService: StripeService,
  ) {}

  public async handle(
    rawBody: Buffer,
    signature: string | undefined,
  ): Promise<{ received: true }> {
    if (!this.stripeService.webhookSecret) {
      throw new BadRequestException('Stripe webhook is not configured');
    }

    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    let event: StripeEvent;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Stripe webhook signature verification failed: ${detail}`,
      );
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      try {
        await this.completeCheckoutProvider.completeFromWebhook(
          paymentIntent.id,
        );
      } catch (err) {
        if (isPermanentCompletionFailure(err)) {
          const detail = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `Webhook checkout completion permanently failed for ${paymentIntent.id}: ${detail}`,
          );
          return { received: true };
        }

        const detail = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Webhook checkout completion transient failure for ${paymentIntent.id}: ${detail}`,
        );

        if (err instanceof HttpException && err.getStatus() >= 500) {
          throw err;
        }

        throw new ServiceUnavailableException(
          'Checkout completion temporarily unavailable',
        );
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      try {
        await this.handlePaymentFailed.handle(paymentIntent);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Webhook payment_failed handling failed for ${paymentIntent.id}: ${detail}`,
        );
        throw new ServiceUnavailableException(
          'Payment failure handling temporarily unavailable',
        );
      }
    }

    return { received: true };
  }
}

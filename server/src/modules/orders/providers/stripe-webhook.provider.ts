import { CompleteCheckoutProvider } from './complete-checkout.provider';
import {
  StripeClient,
  StripeEvent,
  StripePaymentIntent,
  StripeService,
} from 'src/integrations/stripe/stripe.service';
import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class StripeWebhookProvider {
  private readonly logger = new Logger(StripeWebhookProvider.name);
  private readonly stripe: StripeClient;
  private readonly webhookSecret: string | undefined;

  constructor(
    private readonly completeCheckoutProvider: CompleteCheckoutProvider,
    stripeService: StripeService,
  ) {
    this.stripe = stripeService.client;
    this.webhookSecret = stripeService.webhookSecret;
  }

  public async handle(
    rawBody: Buffer,
    signature: string | undefined,
  ): Promise<{ received: true }> {
    const webhookSecret = this.webhookSecret;
    if (!webhookSecret) {
      throw new BadRequestException('Stripe webhook is not configured');
    }

    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    let event: StripeEvent;
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
      const paymentIntent = event.data.object as StripePaymentIntent;
      try {
        await this.completeCheckoutProvider.completeFromWebhook(
          paymentIntent.id,
        );
      } catch (err) {
        if (this.isPermanentCompletionFailure(err)) {
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

        if (
          err instanceof HttpException &&
          err.getStatus() >= HttpStatus.INTERNAL_SERVER_ERROR
        ) {
          throw err;
        }

        throw new ServiceUnavailableException(
          'Checkout completion temporarily unavailable',
        );
      }
    }

    return { received: true };
  }

  /**
   * 4xx from completion are treated as permanent (bad metadata, already
   * cancelled session, insufficient stock, etc.) so Stripe does not retry.
   * Non-HTTP errors (DB blips, timeouts) are transient.
   */
  private isPermanentCompletionFailure(err: unknown): boolean {
    if (!(err instanceof HttpException)) {
      return false;
    }
    const status = err.getStatus();
    return status >= 400 && status < 500;
  }
}

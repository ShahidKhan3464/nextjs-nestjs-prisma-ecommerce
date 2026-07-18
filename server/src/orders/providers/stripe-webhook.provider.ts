import Stripe from 'stripe';
import type { ConfigType } from '@nestjs/config';
import stripeConfig from 'src/config/stripe.config';
import { CompleteCheckoutProvider } from './complete-checkout.provider';
import {
  Inject,
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

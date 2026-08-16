import { CompleteCheckoutProvider } from './complete-checkout.provider';
import {
  StripeService,
  type StripeEvent,
  type StripePaymentIntent,
} from 'src/integrations/stripe';
import {
  Logger,
  Injectable,
  HttpStatus,
  HttpException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class StripeWebhookProvider {
  private readonly logger = new Logger(StripeWebhookProvider.name);

  constructor(
    private readonly completeCheckoutProvider: CompleteCheckoutProvider,
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
   * Only truly permanent client/data errors are acked to Stripe.
   * Fulfillment failures after a successful charge must NOT be silently acked
   * (Stripe will retry; ops can investigate / refund).
   */
  private isPermanentCompletionFailure(err: unknown): boolean {
    if (err instanceof ForbiddenException || err instanceof NotFoundException) {
      return true;
    }

    if (!(err instanceof HttpException)) {
      return false;
    }

    const status = err.getStatus();
    if (status < 400 || status >= 500) {
      return false;
    }

    const message = this.exceptionMessage(err).toLowerCase();

    // Paid but unfulfillable (e.g. legacy stock race) — keep retrying / alert.
    if (message.includes('insufficient stock')) {
      return false;
    }

    return (
      message.includes('amount mismatch') ||
      message.includes('invalid checkout') ||
      message.includes('does not match') ||
      message.includes('payment has not been completed') ||
      message.includes('invalid checkout payment metadata')
    );
  }

  private exceptionMessage(err: HttpException): string {
    const response = err.getResponse();
    if (typeof response === 'string') return response;
    if (response && typeof response === 'object' && 'message' in response) {
      const message = (response as { message?: unknown }).message;
      if (typeof message === 'string') return message;
      if (Array.isArray(message)) return message.map(String).join(', ');
    }
    return err.message;
  }
}

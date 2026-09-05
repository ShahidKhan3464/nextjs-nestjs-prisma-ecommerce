import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import stripeConfig from 'src/config/stripe.config';
import { CancelPaymentProvider } from './providers/cancel-payment.provider';
import { RefundPaymentProvider } from './providers/refund-payment.provider';
import { RetrievePaymentProvider } from './providers/retrieve-payment.provider';
import { ConstructWebhookProvider } from './providers/construct-webhook.provider';
import { CreatePaymentIntentProvider } from './providers/create-payment-intent.provider';
import {
  stripeClientProvider,
  stripeWebhookSecretProvider,
} from './providers/stripe-client.provider';

@Module({
  imports: [ConfigModule.forFeature(stripeConfig)],
  providers: [
    StripeService,
    stripeClientProvider,
    CancelPaymentProvider,
    RefundPaymentProvider,
    RetrievePaymentProvider,
    ConstructWebhookProvider,
    stripeWebhookSecretProvider,
    CreatePaymentIntentProvider,
  ],
  exports: [StripeService],
})
export class StripeModule {}

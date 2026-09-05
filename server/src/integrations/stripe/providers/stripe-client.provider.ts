import Stripe from 'stripe';
import type { Provider } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import stripeConfig from 'src/config/stripe.config';
import type { StripeClient } from '../types/stripe.types';
import {
  STRIPE_CLIENT,
  STRIPE_WEBHOOK_SECRET,
} from '../constants/stripe.constants';

export const stripeClientProvider: Provider = {
  provide: STRIPE_CLIENT,
  inject: [stripeConfig.KEY],
  useFactory: (
    stripeConfiguration: ConfigType<typeof stripeConfig>,
  ): StripeClient => {
    const secretKey = stripeConfiguration.secretKey;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    return new Stripe(secretKey, {
      timeout: 20_000,
      maxNetworkRetries: 1,
    });
  },
};

export const stripeWebhookSecretProvider: Provider = {
  provide: STRIPE_WEBHOOK_SECRET,
  inject: [stripeConfig.KEY],
  useFactory: (
    stripeConfiguration: ConfigType<typeof stripeConfig>,
  ): string | undefined => stripeConfiguration.webhookSecret,
};

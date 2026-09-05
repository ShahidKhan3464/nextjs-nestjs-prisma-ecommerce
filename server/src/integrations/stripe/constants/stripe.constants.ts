/** Injection token for the shared Stripe SDK client. */
export const STRIPE_CLIENT = Symbol('STRIPE_CLIENT');

/** Injection token for the Stripe webhook signing secret. */
export const STRIPE_WEBHOOK_SECRET = Symbol('STRIPE_WEBHOOK_SECRET');

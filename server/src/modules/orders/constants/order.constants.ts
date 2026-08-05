export { OrderStatus } from 'src/common/enums/order-status.enum';
export { PaymentStatus } from 'src/common/enums/payment-status.enum';
export { PaymentProvider } from 'src/common/enums/payment-provider.enum';
export { CheckoutSessionStatus } from 'src/common/enums/checkout-session-status.enum';

/** Pending checkouts older than this release reserved stock. */
export const CHECKOUT_ABANDON_TTL_MS = 30 * 60 * 1000;

/** Stripe / payment currency for checkout PaymentIntents and order payments. */
export const CHECKOUT_CURRENCY = 'usd';


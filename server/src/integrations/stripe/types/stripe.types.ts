import Stripe from 'stripe';

/** Stripe SDK client type — import this instead of `stripe` outside the integration layer. */
export type StripeClient = Stripe;
export type StripeEvent = Stripe.Event;
export type StripePaymentIntent = Stripe.PaymentIntent;
export type StripeRefund = Stripe.Response<Stripe.Refund>;

export type CreateRefundParams = Stripe.RefundCreateParams;
export type CreateRefundRequestOptions = Stripe.RequestOptions;
export type CreatePaymentIntentRequestOptions = Stripe.RequestOptions;
export type CreatePaymentIntentParams = Stripe.PaymentIntentCreateParams;
export type RetrievePaymentIntentParams = Stripe.PaymentIntentRetrieveParams;

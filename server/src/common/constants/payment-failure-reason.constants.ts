/** Canonical failure reason messages stored on Payment.failureReason. */
export const PaymentFailureReason = {
  COD_REJECTED: 'COD rejected',
  CARD_DECLINED: 'Card declined',
  PAYMENT_EXPIRED: 'Payment expired',
  PAYMENT_CANCELLED: 'Payment cancelled',
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  PROVIDER_FAILURE: 'Payment provider failure',
  AUTHENTICATION_REQUIRED: 'Authentication required',
  WEBHOOK_VERIFICATION_FAILED: 'Webhook verification failed',
} as const;

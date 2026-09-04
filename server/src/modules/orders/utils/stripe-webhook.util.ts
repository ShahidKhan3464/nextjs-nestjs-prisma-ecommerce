import {
  HttpException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Only truly permanent client/data errors are acked to Stripe.
 * Fulfillment failures after a successful charge must NOT be silently acked.
 */
export function isPermanentCompletionFailure(err: unknown): boolean {
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

  const message = exceptionMessage(err).toLowerCase();

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

function exceptionMessage(err: HttpException): string {
  const response = err.getResponse();
  if (typeof response === 'string') return response;
  if (response && typeof response === 'object' && 'message' in response) {
    const message = (response as { message?: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.map(String).join(', ');
  }
  return err.message;
}

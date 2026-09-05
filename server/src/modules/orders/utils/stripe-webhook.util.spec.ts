import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { isPermanentCompletionFailure } from './stripe-webhook.util';

describe('isPermanentCompletionFailure', () => {
  it('acks forbidden and not found', () => {
    expect(isPermanentCompletionFailure(new ForbiddenException())).toBe(true);
    expect(isPermanentCompletionFailure(new NotFoundException())).toBe(true);
  });

  it('does not ack insufficient stock (paid but unfulfillable)', () => {
    expect(
      isPermanentCompletionFailure(
        new BadRequestException('Insufficient stock for SKU-1'),
      ),
    ).toBe(false);
  });

  it('acks amount mismatch and invalid checkout metadata', () => {
    expect(
      isPermanentCompletionFailure(
        new BadRequestException('Payment amount mismatch'),
      ),
    ).toBe(true);
    expect(
      isPermanentCompletionFailure(
        new BadRequestException('Invalid checkout payment metadata'),
      ),
    ).toBe(true);
  });

  it('does not ack 5xx / unknown errors', () => {
    expect(
      isPermanentCompletionFailure(new ServiceUnavailableException()),
    ).toBe(false);
    expect(isPermanentCompletionFailure(new Error('db down'))).toBe(false);
  });
});

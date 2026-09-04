import {
  hashCheckoutRequest,
  normalizeIdempotencyKey,
} from './checkout-idempotency.util';
import type { ShippingAddressDto } from '../dto/create-checkout.dto';

const address: ShippingAddressDto = {
  fullName: 'Jane Doe',
  line1: '123 Market Street',
  city: 'New York',
  region: 'NY',
  postalCode: '10001',
  country: 'United States',
};

describe('checkout idempotency helpers', () => {
  it('normalizes and truncates keys', () => {
    expect(normalizeIdempotencyKey('  abcdefgh  ')).toBe('abcdefgh');
    expect(normalizeIdempotencyKey('')).toBeUndefined();
    expect(normalizeIdempotencyKey(undefined)).toBeUndefined();
    expect(normalizeIdempotencyKey('x'.repeat(200))?.length).toBe(128);
  });

  it('hashes equivalent addresses the same way', () => {
    const a = hashCheckoutRequest({ ...address, line2: '  ' });
    const b = hashCheckoutRequest({ ...address, line2: undefined });
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('hashes different addresses differently', () => {
    expect(hashCheckoutRequest(address)).not.toBe(
      hashCheckoutRequest({ ...address, city: 'Boston' }),
    );
  });
});

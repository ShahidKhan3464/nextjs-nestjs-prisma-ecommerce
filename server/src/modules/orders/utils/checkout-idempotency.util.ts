import { createHash } from 'crypto';
import type { ShippingAddressDto } from '../dto/create-checkout.dto';

export const CHECKOUT_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;
export const CHECKOUT_IDEMPOTENCY_IN_FLIGHT_MS = 2 * 60 * 1000;

export function normalizeIdempotencyKey(
  value: string | undefined,
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, 128);
}

export function hashCheckoutRequest(
  shippingAddress: ShippingAddressDto,
): string {
  const canonical = {
    fullName: shippingAddress.fullName.trim(),
    line1: shippingAddress.line1.trim(),
    line2: shippingAddress.line2?.trim() ?? '',
    city: shippingAddress.city.trim(),
    region: shippingAddress.region.trim(),
    postalCode: shippingAddress.postalCode.trim(),
    country: shippingAddress.country.trim(),
    phone: shippingAddress.phone?.trim() ?? '',
  };
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

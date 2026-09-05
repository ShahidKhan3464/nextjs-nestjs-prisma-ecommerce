import { centsToDollarNumber, toCents } from 'src/common/utils/money.util';

export type OrderPricing = {
  tax: number;
  total: number;
  subtotal: number;
  taxCents: number;
  totalCents: number;
  subtotalCents: number;
};

/** Checkout totals without shipping, tax, coupons, or discounts. */
export function calculateOrderPricingFromCents(
  subtotalCents: number,
): OrderPricing {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error('Subtotal cents must be a non-negative integer');
  }

  const taxCents = 0;
  const totalCents = subtotalCents + taxCents;

  return {
    taxCents,
    totalCents,
    subtotalCents,
    tax: centsToDollarNumber(taxCents),
    total: centsToDollarNumber(totalCents),
    subtotal: centsToDollarNumber(subtotalCents),
  };
}

export function calculateOrderPricing(subtotal: number): OrderPricing {
  return calculateOrderPricingFromCents(toCents(subtotal));
}

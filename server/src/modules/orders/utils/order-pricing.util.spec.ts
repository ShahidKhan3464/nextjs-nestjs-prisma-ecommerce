import { toCents } from 'src/common/utils/money.util';
import {
  calculateOrderPricing,
  calculateOrderPricingFromCents,
} from './order-pricing.util';

describe('calculateOrderPricingFromCents', () => {
  it('keeps 0.10 + 0.20 exact with zero tax', () => {
    const pricing = calculateOrderPricingFromCents(
      toCents('0.10') + toCents('0.20'),
    );
    expect(pricing.subtotalCents).toBe(30);
    expect(pricing.taxCents).toBe(0);
    expect(pricing.totalCents).toBe(30);
    expect(pricing.subtotal).toBe(0.3);
    expect(pricing.tax).toBe(0);
    expect(pricing.total).toBe(0.3);
  });

  it('prices 19.99 without float rounding', () => {
    const pricing = calculateOrderPricingFromCents(toCents('19.99'));
    expect(pricing.totalCents).toBe(1999);
    expect(pricing.total).toBe(19.99);
  });

  it('sums multiple line items in cents', () => {
    const pricing = calculateOrderPricingFromCents(
      toCents('10.01') + toCents('9.98') + toCents('5.00') * 2,
    );
    expect(pricing.subtotalCents).toBe(2999);
    expect(pricing.totalCents).toBe(2999);
  });

  it('accepts a dollar subtotal through the compatibility wrapper', () => {
    const pricing = calculateOrderPricing(19.99);
    expect(pricing.totalCents).toBe(1999);
  });
});

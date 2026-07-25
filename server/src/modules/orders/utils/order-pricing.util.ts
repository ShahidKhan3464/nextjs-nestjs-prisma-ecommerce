export type OrderPricing = {
  tax: number;
  total: number;
  subtotal: number;
};

/** Checkout totals without shipping, tax, coupons, or discounts. */
export function calculateOrderPricing(subtotal: number): OrderPricing {
  const rounded = Math.round(subtotal * 100) / 100;

  return {
    tax: 0,
    total: rounded,
    subtotal: rounded,
  };
}

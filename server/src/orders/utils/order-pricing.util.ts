export type OrderPricing = {
  tax: number;
  total: number;
  subtotal: number;
};

export function calculateOrderPricing(subtotal: number): OrderPricing {
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return {
    tax,
    total,
    subtotal,
  };
}

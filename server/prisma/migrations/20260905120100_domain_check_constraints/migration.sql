-- Fail loudly if existing rows would violate the new invariants.
-- stockQuantity >= 0 already exists (CHK_product_variants_stock_quantity_non_negative).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "reviews" WHERE rating < 1 OR rating > 5) THEN
    RAISE EXCEPTION
      'Cannot add reviews rating CHECK: existing rows have rating outside 1-5';
  END IF;

  IF EXISTS (SELECT 1 FROM "payments" WHERE amount < 0) THEN
    RAISE EXCEPTION
      'Cannot add payments amount CHECK: existing rows have negative amount';
  END IF;

  IF EXISTS (SELECT 1 FROM "orders" WHERE "totalAmount" < 0) THEN
    RAISE EXCEPTION
      'Cannot add orders totalAmount CHECK: existing rows have negative totalAmount';
  END IF;

  IF EXISTS (SELECT 1 FROM "order_items" WHERE quantity <= 0) THEN
    RAISE EXCEPTION
      'Cannot add order_items quantity CHECK: existing rows have quantity <= 0';
  END IF;
END $$;

ALTER TABLE "reviews"
  ADD CONSTRAINT "CHK_reviews_rating_range"
  CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE "payments"
  ADD CONSTRAINT "CHK_payments_amount_non_negative"
  CHECK (amount >= 0);

ALTER TABLE "orders"
  ADD CONSTRAINT "CHK_orders_total_amount_non_negative"
  CHECK ("totalAmount" >= 0);

ALTER TABLE "order_items"
  ADD CONSTRAINT "CHK_order_items_quantity_positive"
  CHECK (quantity > 0);

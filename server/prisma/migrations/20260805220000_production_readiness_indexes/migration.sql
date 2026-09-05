-- Production readiness: FK / sort indexes for hot query paths

CREATE INDEX IF NOT EXISTS "IDX_product_variants_product_id" ON "product_variants"("productId");

CREATE INDEX IF NOT EXISTS "IDX_cart_items_product_variant_id" ON "cart_items"("productVariantId");

CREATE INDEX IF NOT EXISTS "IDX_wishlist_items_product_id" ON "wishlist_items"("productId");

CREATE INDEX IF NOT EXISTS "IDX_orders_created_at" ON "orders"("createdAt");

CREATE INDEX IF NOT EXISTS "IDX_order_items_variant_id" ON "order_items"("variantId");

CREATE INDEX IF NOT EXISTS "IDX_notifications_created_at" ON "notifications"("createdAt");

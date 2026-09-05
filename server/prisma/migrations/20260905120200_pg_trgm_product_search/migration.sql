-- Accelerate ILIKE '%term%' product name/description search.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "IDX_products_name_trgm"
  ON "products" USING gin ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "IDX_products_description_trgm"
  ON "products" USING gin ("description" gin_trgm_ops);

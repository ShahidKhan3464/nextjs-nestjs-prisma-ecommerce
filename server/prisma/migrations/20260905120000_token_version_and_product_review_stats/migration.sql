-- Access-token invalidation + denormalized product rating fields for SQL sort.

ALTER TABLE "users"
  ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "products"
  ADD COLUMN "averageRating" DECIMAL(3,1) NOT NULL DEFAULT 0,
  ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "products" AS p
SET
  "averageRating" = s.avg_rating,
  "reviewCount" = s.review_count
FROM (
  SELECT
    "productId",
    ROUND(AVG(rating)::numeric, 1) AS avg_rating,
    COUNT(*)::integer AS review_count
  FROM "reviews"
  GROUP BY "productId"
) AS s
WHERE p.id = s."productId";

CREATE INDEX "IDX_products_average_rating_id"
  ON "products" ("averageRating" DESC, "id" DESC);

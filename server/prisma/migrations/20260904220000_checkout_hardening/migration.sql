-- Checkout/order linkage, inventory CHECK, unique PaymentIntents, idempotency, audit, job locks.

-- Clamp any existing negative stock before the CHECK constraint.
UPDATE "product_variants" SET "stockQuantity" = 0 WHERE "stockQuantity" < 0;

ALTER TABLE "product_variants"
  ADD CONSTRAINT "CHK_product_variants_stock_quantity_non_negative"
  CHECK ("stockQuantity" >= 0);

ALTER TABLE "orders"
  ADD COLUMN "checkoutSessionId" INTEGER;

ALTER TABLE "orders"
  ADD CONSTRAINT "FK_orders_checkout_session_id"
  FOREIGN KEY ("checkoutSessionId") REFERENCES "checkout_sessions"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

CREATE INDEX "IDX_orders_checkout_session_id" ON "orders"("checkoutSessionId");

CREATE INDEX "IDX_orders_user_id_created_at" ON "orders"("userId", "createdAt");

CREATE INDEX "IDX_orders_store_id_created_at" ON "orders"("storeId", "createdAt");

CREATE INDEX "IDX_checkout_sessions_status_created_at" ON "checkout_sessions"("status", "createdAt");

-- One live/completed checkout session per real PaymentIntent.
-- Exclude EXPIRED/CANCELLED so historical rows cannot block a later session.
-- Do NOT unique payments.transactionId: multi-vendor checkout writes one
-- payment row per store against the same PaymentIntent.
CREATE UNIQUE INDEX "UQ_checkout_sessions_stripe_pi_not_pending"
  ON "checkout_sessions"("stripePaymentIntentId")
  WHERE "stripePaymentIntentId" <> 'pending'
    AND status IN ('PENDING', 'COMPLETED');

CREATE TABLE "checkout_idempotency_keys" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "key" VARCHAR(128) NOT NULL,
  "requestHash" VARCHAR(64) NOT NULL,
  "responseJson" JSONB,
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(6),

  CONSTRAINT "checkout_idempotency_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UQ_checkout_idempotency_keys_user_id_key"
  ON "checkout_idempotency_keys"("userId", "key");

CREATE INDEX "IDX_checkout_idempotency_keys_created_at"
  ON "checkout_idempotency_keys"("createdAt");

ALTER TABLE "checkout_idempotency_keys"
  ADD CONSTRAINT "checkout_idempotency_keys_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

CREATE TABLE "audit_logs" (
  "id" SERIAL NOT NULL,
  "actorId" INTEGER,
  "actorRole" VARCHAR(32),
  "action" VARCHAR(64) NOT NULL,
  "entityType" VARCHAR(64) NOT NULL,
  "entityId" VARCHAR(64) NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "requestId" VARCHAR(128),
  "ip" VARCHAR(64),
  "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IDX_audit_logs_entity" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "IDX_audit_logs_actor_id" ON "audit_logs"("actorId");
CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs"("createdAt");

CREATE TABLE "job_locks" (
  "name" VARCHAR(64) NOT NULL,
  "lockedUntil" TIMESTAMP(6) NOT NULL,
  "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "job_locks_pkey" PRIMARY KEY ("name")
);

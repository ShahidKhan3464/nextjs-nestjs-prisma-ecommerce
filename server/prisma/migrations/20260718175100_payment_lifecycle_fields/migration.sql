-- Expand payment_status_enum for full lifecycle tracking
ALTER TYPE "payment_status_enum" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "payment_status_enum" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "payment_status_enum" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';

-- Refund tracking fields on payments
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "refundReason" VARCHAR(255);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(6);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "externalRefundId" VARCHAR(255);

-- Provider filter index
CREATE INDEX IF NOT EXISTS "IDX_payments_provider" ON "payments"("provider");

-- CreateTable
CREATE TABLE "user_addresses" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "label" VARCHAR(100),
    "fullName" VARCHAR(100) NOT NULL,
    "line1" VARCHAR(255) NOT NULL,
    "line2" VARCHAR(255),
    "city" VARCHAR(100) NOT NULL,
    "region" VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(20) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30),
    "isDefaultShipping" BOOLEAN NOT NULL DEFAULT false,
    "isDefaultBilling" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_addresses_userId_idx" ON "user_addresses"("userId");

-- CreateIndex
CREATE INDEX "user_addresses_userId_isDefaultShipping_idx" ON "user_addresses"("userId", "isDefaultShipping");

-- CreateIndex
CREATE INDEX "user_addresses_userId_isDefaultBilling_idx" ON "user_addresses"("userId", "isDefaultBilling");

-- AddForeignKey
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AlterEnum
ALTER TYPE "notification_type_enum" ADD VALUE 'ORDER_CANCELLED';
ALTER TYPE "notification_type_enum" ADD VALUE 'STORE_ANNOUNCEMENT';
ALTER TYPE "notification_type_enum" ADD VALUE 'PRODUCT_BACK_IN_STOCK';

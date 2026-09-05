-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "store_file_type_enum" AS ENUM ('LOGO', 'BANNER');

-- CreateEnum
CREATE TYPE "seller_document_type_enum" AS ENUM ('BUSINESS_LICENSE', 'TAX_DOCUMENT');

-- CreateEnum
CREATE TYPE "user_role_name_enum" AS ENUM ('BUYER', 'SELLER', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "seller_profile_status_enum" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "store_status_enum" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "payment_provider_enum" AS ENUM ('STRIPE', 'COD', 'OTHER');

-- CreateEnum
CREATE TYPE "payment_status_enum" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "checkout_session_status_enum" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "notification_type_enum" AS ENUM ('ORDER_CREATED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'SELLER_APPROVED', 'SELLER_REJECTED', 'PRODUCT_APPROVED', 'PRODUCT_REJECTED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "orders_status_enum" AS ENUM ('PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "products_status_enum" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "product_file_type_enum" AS ENUM ('THUMBNAIL', 'GALLERY', 'MANUAL');

-- CreateEnum
CREATE TYPE "user_file_type_enum" AS ENUM ('AVATAR', 'DOCUMENT', 'COVER');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "fullName" VARCHAR(30) NOT NULL,
    "phoneNumber" VARCHAR,
    "email" VARCHAR NOT NULL,
    "password" VARCHAR NOT NULL,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "familyId" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "revokedAt" TIMESTAMP(6),
    "replacedByHash" VARCHAR(128),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" INTEGER NOT NULL,
    "role" "user_role_name_enum" NOT NULL,
    "assignedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","role")
);

-- CreateTable
CREATE TABLE "seller_profiles" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "businessName" VARCHAR(255) NOT NULL,
    "businessEmail" VARCHAR(255) NOT NULL,
    "businessPhone" VARCHAR(30) NOT NULL,
    "taxNumber" VARCHAR(50),
    "registrationNumber" VARCHAR(50),
    "status" "seller_profile_status_enum" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(6),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "PK_seller_profiles" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" SERIAL NOT NULL,
    "sellerProfileId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "address" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "postalCode" VARCHAR(20) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "status" "store_status_enum" NOT NULL DEFAULT 'ACTIVE',
    "verifiedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suspensionReason" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "PK_stores" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "basePrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "products_status_enum" NOT NULL DEFAULT 'ACTIVE',
    "publishedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(6),
    "categoryId" INTEGER NOT NULL,
    "storeId" INTEGER NOT NULL,

    CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" SERIAL NOT NULL,
    "size" VARCHAR(255) NOT NULL,
    "color" VARCHAR(255) NOT NULL,
    "sku" VARCHAR NOT NULL,
    "stockQuantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "PK_281e3f2c55652d6a22c0aa59fd7" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stored_files" (
    "id" SERIAL NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "storedName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "extension" VARCHAR(20) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageKey" VARCHAR(512) NOT NULL,
    "urlPath" VARCHAR(512) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_files" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_files" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,
    "type" "product_file_type_enum" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_files" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,
    "type" "user_file_type_enum" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_files" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,
    "type" "store_file_type_enum" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "store_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_documents" (
    "id" SERIAL NOT NULL,
    "sellerProfileId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,
    "type" "seller_document_type_enum" NOT NULL,

    CONSTRAINT "seller_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productVariantId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_0bd52924a97cda208ed2a07bd69" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "storeId" INTEGER NOT NULL,
    "orderNumber" VARCHAR(64) NOT NULL,
    "status" "orders_status_enum" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shippingAddress" TEXT NOT NULL,
    "cancellationReason" TEXT,
    "shippedAt" TIMESTAMP(6),
    "deliveredAt" TIMESTAMP(6),
    "cancelledAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "productName" VARCHAR(255) NOT NULL,
    "variantSku" VARCHAR(100) NOT NULL,
    "variantColor" VARCHAR(255) NOT NULL,
    "variantSize" VARCHAR(255) NOT NULL,
    "priceAtPurchase" DECIMAL(10,2) NOT NULL,
    "productImageUrl" VARCHAR(512),

    CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "provider" "payment_provider_enum" NOT NULL DEFAULT 'STRIPE',
    "transactionId" VARCHAR(255),
    "failureReason" VARCHAR(255),
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
    "status" "payment_status_enum" NOT NULL DEFAULT 'PENDING',
    "methodSummary" VARCHAR(255),
    "paidAt" TIMESTAMP(6),
    "refundedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "refundReason" VARCHAR(255),
    "refundedAt" TIMESTAMP(6),
    "externalRefundId" VARCHAR(255),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_payments" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_sessions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "checkout_session_status_enum" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "shippingAddress" TEXT NOT NULL,
    "stripePaymentIntentId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_5730b2bbc190203a94941d82bd1" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_session_items" (
    "id" SERIAL NOT NULL,
    "checkoutSessionId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceAtPurchase" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "PK_4bc14bdd64e6077b3c75fcf2cfe" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" VARCHAR(255),
    "comment" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_reviews" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "notification_type_enum" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_users_phone_number" ON "users"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_97672ac88f789774dd47f7c8be3" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "IDX_user_roles_role" ON "user_roles"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_seller_profiles_user_id" ON "seller_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_seller_profiles_business_email" ON "seller_profiles"("businessEmail");

-- CreateIndex
CREATE INDEX "seller_profiles_deletedAt_idx" ON "seller_profiles"("deletedAt");

-- CreateIndex
CREATE INDEX "seller_profiles_businessName_idx" ON "seller_profiles"("businessName");

-- CreateIndex
CREATE INDEX "IDX_seller_profiles_status" ON "seller_profiles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_stores_seller_profile_id" ON "stores"("sellerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_stores_slug" ON "stores"("slug");

-- CreateIndex
CREATE INDEX "stores_deletedAt_idx" ON "stores"("deletedAt");

-- CreateIndex
CREATE INDEX "IDX_stores_status" ON "stores"("status");

-- CreateIndex
CREATE INDEX "categories_deletedAt_idx" ON "categories"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_464f927ae360106b783ed0b4106" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_deletedAt_idx" ON "products"("deletedAt");

-- CreateIndex
CREATE INDEX "IDX_products_name" ON "products"("name");

-- CreateIndex
CREATE INDEX "IDX_products_status" ON "products"("status");

-- CreateIndex
CREATE INDEX "IDX_ff56834e735fa78a15d0cf2192" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "IDX_products_store_id" ON "products"("storeId");

-- CreateIndex
CREATE INDEX "IDX_products_published_at" ON "products"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_46f236f21640f9da218a063a866" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_product_variants_product_id_color_size" ON "product_variants"("productId", "color", "size");

-- CreateIndex
CREATE UNIQUE INDEX "stored_files_storageKey_key" ON "stored_files"("storageKey");

-- CreateIndex
CREATE INDEX "product_files_fileId_idx" ON "product_files"("fileId");

-- CreateIndex
CREATE INDEX "product_files_type_idx" ON "product_files"("type");

-- CreateIndex
CREATE UNIQUE INDEX "product_files_productId_fileId_key" ON "product_files"("productId", "fileId");

-- CreateIndex
CREATE INDEX "user_files_fileId_idx" ON "user_files"("fileId");

-- CreateIndex
CREATE INDEX "user_files_type_idx" ON "user_files"("type");

-- CreateIndex
CREATE UNIQUE INDEX "user_files_userId_fileId_key" ON "user_files"("userId", "fileId");

-- CreateIndex
CREATE INDEX "store_files_fileId_idx" ON "store_files"("fileId");

-- CreateIndex
CREATE INDEX "store_files_type_idx" ON "store_files"("type");

-- CreateIndex
CREATE UNIQUE INDEX "store_files_storeId_fileId_key" ON "store_files"("storeId", "fileId");

-- CreateIndex
CREATE INDEX "seller_documents_fileId_idx" ON "seller_documents"("fileId");

-- CreateIndex
CREATE INDEX "seller_documents_type_idx" ON "seller_documents"("type");

-- CreateIndex
CREATE UNIQUE INDEX "seller_documents_sellerProfileId_fileId_key" ON "seller_documents"("sellerProfileId", "fileId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_029e3499726b1681378523174da" ON "cart_items"("userId", "productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_d461b3ed3990144aa6d5c45083b" ON "wishlist_items"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_59b0c3b34ea0fa5562342f24143" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "IDX_orders_user_id" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "IDX_orders_status" ON "orders"("status");

-- CreateIndex
CREATE INDEX "IDX_orders_store_id" ON "orders"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_order_items_order_id_variant_id" ON "order_items"("orderId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_payments_order_id" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "IDX_payments_transaction_id" ON "payments"("transactionId");

-- CreateIndex
CREATE INDEX "IDX_payments_status" ON "payments"("status");

-- CreateIndex
CREATE INDEX "IDX_payments_provider" ON "payments"("provider");

-- CreateIndex
CREATE INDEX "IDX_checkout_sessions_user_id" ON "checkout_sessions"("userId");

-- CreateIndex
CREATE INDEX "IDX_checkout_sessions_status" ON "checkout_sessions"("status");

-- CreateIndex
CREATE INDEX "IDX_checkout_sessions_stripe_payment_intent_id" ON "checkout_sessions"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_checkout_session_items_checkout_session_id_variant_id" ON "checkout_session_items"("checkoutSessionId", "variantId");

-- CreateIndex
CREATE INDEX "IDX_reviews_product_id" ON "reviews"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_reviews_user_id_product_id" ON "reviews"("userId", "productId");

-- CreateIndex
CREATE INDEX "IDX_notifications_user_id" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "IDX_notifications_user_id_is_read" ON "notifications"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_user_id" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "seller_profiles" ADD CONSTRAINT "FK_seller_profiles_user_id" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "FK_stores_seller_profile_id" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "FK_products_store_id" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "FK_f515690c571a03400a9876600b5" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "product_files" ADD CONSTRAINT "product_files_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_files" ADD CONSTRAINT "product_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_files" ADD CONSTRAINT "user_files_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_files" ADD CONSTRAINT "user_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "store_files" ADD CONSTRAINT "store_files_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_files" ADD CONSTRAINT "store_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_documents" ADD CONSTRAINT "seller_documents_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_documents" ADD CONSTRAINT "seller_documents_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "FK_84e765378a5f03ad9900df3a9ba" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "FK_98ba4bbf6e3611d2062b898f5c1" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_3167e7490f12ed329a36703d980" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "FK_485ece8ab9b569d1c560144aa25" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "FK_orders_store_id" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "FK_151b79a83ba240b0cb31b2302d1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "FK_516736b9807228bb17b2d0a3e2a" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "FK_f1d359a55923bb45b057fbdab0d" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_order_id" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "FK_03c03fa217eec30f71d2762f44e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "checkout_session_items" ADD CONSTRAINT "FK_57044fc85b65fe42b4cfcaf05c2" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "checkout_session_items" ADD CONSTRAINT "FK_ec11f9a5ff93785bf57e652bef3" FOREIGN KEY ("checkoutSessionId") REFERENCES "checkout_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_product_id" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_user_id" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user_id" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

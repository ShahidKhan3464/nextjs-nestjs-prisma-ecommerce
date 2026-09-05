import { ProductStatus } from 'src/common/enums/product-status.enum';
import { CartItemWithRelations } from 'src/common/types/domain.types';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StoreStatus } from 'src/modules/stores/constants/store.constants';
import { SellerProfileStatus } from 'src/modules/sellers/constants/seller.constants';
import { assertNotOwnStorePurchase } from 'src/common/utils/assert-not-own-store-purchase.util';
import {
  toCents,
  centsToDecimalString,
  centsToDollarNumber,
} from 'src/common/utils/money.util';

type ValidatedCheckoutLine = {
  cartItemId: number;
  storeId: number;
  variantId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  unitPriceCents: number;
  priceAtPurchase: string;
  productName: string;
  variantSku: string;
  variantColor: string;
  variantSize: string;
  stockQuantity: number;
  productImageUrl: string | null;
};

export type StoreCheckoutGroup = {
  storeId: number;
  lines: ValidatedCheckoutLine[];
  subtotal: number;
  total: number;
  subtotalCents: number;
  totalCents: number;
};

/**
 * Revalidates every cart line for multi-vendor checkout.
 * Never trusts prior cart validation.
 */
export function validateAndGroupCheckoutCart(
  cartItems: CartItemWithRelations[],
  buyerUserId: number,
): StoreCheckoutGroup[] {
  if (cartItems.length === 0) {
    throw new BadRequestException('Cart is empty');
  }

  const groups = new Map<number, ValidatedCheckoutLine[]>();

  for (const item of cartItems) {
    const line = validateCheckoutCartItem(item, buyerUserId);
    const existing = groups.get(line.storeId) ?? [];
    existing.push(line);
    groups.set(line.storeId, existing);
  }

  return Array.from(groups.entries()).map(([storeId, lines]) => {
    const subtotalCents = lines.reduce(
      (sum, line) => sum + line.unitPriceCents * line.quantity,
      0,
    );

    return {
      storeId,
      lines,
      subtotalCents,
      totalCents: subtotalCents,
      subtotal: centsToDollarNumber(subtotalCents),
      total: centsToDollarNumber(subtotalCents),
    };
  });
}

function validateCheckoutCartItem(
  item: CartItemWithRelations,
  buyerUserId: number,
): ValidatedCheckoutLine {
  if (!item.quantity || item.quantity <= 0) {
    throw new BadRequestException('Invalid quantity');
  }

  const variant = item.variant;
  if (!variant) {
    throw new NotFoundException('Variant not found');
  }

  const product = variant.product;
  if (!product) {
    throw new NotFoundException('Product not found');
  }

  if (product.deletedAt) {
    throw new BadRequestException('Product unavailable');
  }

  if (product.status !== ProductStatus.ACTIVE) {
    throw new BadRequestException('Product unavailable');
  }

  if (variant.productId !== product.id) {
    throw new BadRequestException('Invalid product/variant relationship');
  }

  const store = product.store;
  if (!store) {
    throw new NotFoundException('Store not found');
  }

  if (store.deletedAt) {
    throw new BadRequestException('Store unavailable');
  }

  if (store.status !== StoreStatus.ACTIVE) {
    throw new BadRequestException('Store unavailable');
  }

  if (product.storeId !== store.id) {
    throw new BadRequestException('Product does not belong to store');
  }

  const sellerProfile = store.sellerProfile;
  if (!sellerProfile || sellerProfile.deletedAt) {
    throw new BadRequestException('Seller profile missing');
  }

  if (sellerProfile.status !== SellerProfileStatus.APPROVED) {
    throw new BadRequestException('Store unavailable');
  }

  assertNotOwnStorePurchase(buyerUserId, sellerProfile.userId);

  if (item.quantity > variant.stockQuantity) {
    throw new BadRequestException(`Insufficient stock for ${variant.sku}`);
  }

  const productImageUrl =
    product.images?.[0]?.urlPath ??
    (product.images?.length ? product.images[0].urlPath : null);
  const unitPriceCents = toCents(variant.price);

  return {
    productImageUrl,
    storeId: store.id,
    cartItemId: item.id,
    variantId: variant.id,
    productId: product.id,
    quantity: item.quantity,
    variantSku: variant.sku,
    productName: product.name,
    variantSize: variant.size,
    variantColor: variant.color,
    unitPriceCents,
    unitPrice: centsToDollarNumber(unitPriceCents),
    priceAtPurchase: centsToDecimalString(unitPriceCents),
    stockQuantity: variant.stockQuantity,
  };
}

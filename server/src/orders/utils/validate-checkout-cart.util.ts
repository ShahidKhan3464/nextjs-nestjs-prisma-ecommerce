import { StoreStatus } from 'src/store/constants/store.constants';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { CartItemWithRelations } from 'src/common/types/domain.types';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SellerProfileStatus } from 'src/seller/constants/seller.constants';

export type ValidatedCheckoutLine = {
  cartItemId: number;
  storeId: number;
  variantId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  productName: string;
  variantSku: string;
  variantColor: string;
  variantSize: string;
  productImageUrl: string | null;
  stockQuantity: number;
};

export type StoreCheckoutGroup = {
  storeId: number;
  lines: ValidatedCheckoutLine[];
  subtotal: number;
  total: number;
};

/**
 * Revalidates every cart line for multi-vendor checkout.
 * Never trusts prior cart validation.
 */
export function validateAndGroupCheckoutCart(
  cartItems: CartItemWithRelations[],
): StoreCheckoutGroup[] {
  if (cartItems.length === 0) {
    throw new BadRequestException('Cart is empty');
  }

  const groups = new Map<number, ValidatedCheckoutLine[]>();

  for (const item of cartItems) {
    const line = validateCheckoutCartItem(item);
    const existing = groups.get(line.storeId) ?? [];
    existing.push(line);
    groups.set(line.storeId, existing);
  }

  return Array.from(groups.entries()).map(([storeId, lines]) => {
    const subtotal =
      Math.round(
        lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) *
          100,
      ) / 100;

    return {
      storeId,
      lines,
      subtotal,
      total: subtotal,
    };
  });
}

function validateCheckoutCartItem(
  item: CartItemWithRelations,
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

  if (item.quantity > variant.stockQuantity) {
    throw new BadRequestException(`Insufficient stock for ${variant.sku}`);
  }

  const productImageUrl =
    product.images?.[0]?.urlPath ??
    (product.images?.length ? product.images[0].urlPath : null);

  return {
    cartItemId: item.id,
    storeId: store.id,
    variantId: variant.id,
    productId: product.id,
    quantity: item.quantity,
    unitPrice: Number(variant.price),
    productName: product.name,
    variantSku: variant.sku,
    variantColor: variant.color,
    variantSize: variant.size,
    productImageUrl,
    stockQuantity: variant.stockQuantity,
  };
}

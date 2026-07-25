import { BadRequestException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { StoreStatus } from 'src/modules/stores/constants/store.constants';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { SellerProfileStatus } from 'src/modules/sellers/constants/seller.constants';

/** Prisma where: variant is purchasable (same rules as checkout). */
export const AVAILABLE_VARIANT_WHERE: Prisma.ProductVariantWhereInput = {
  stockQuantity: { gt: 0 },
  product: {
    deletedAt: null,
    status: ProductStatus.ACTIVE,
    store: {
      deletedAt: null,
      status: StoreStatus.ACTIVE,
      sellerProfile: {
        deletedAt: null,
        status: SellerProfileStatus.APPROVED,
      },
    },
  },
};

export const AVAILABLE_VARIANT_INCLUDE = {
  product: {
    select: {
      id: true,
      status: true,
      deletedAt: true,
      storeId: true,
      store: {
        select: {
          id: true,
          status: true,
          deletedAt: true,
          sellerProfile: {
            select: {
              id: true,
              status: true,
              deletedAt: true,
            },
          },
        },
      },
    },
  },
} as const;

export function assertVariantAvailable(variant: {
  stockQuantity: number;
  product: {
    deletedAt: Date | null;
    status: string;
    store: {
      deletedAt: Date | null;
      status: string;
      sellerProfile: {
        deletedAt: Date | null;
        status: string;
      } | null;
    } | null;
  } | null;
}): void {
  const product = variant.product;
  if (
    !product ||
    product.deletedAt ||
    product.status !== ProductStatus.ACTIVE ||
    !product.store ||
    product.store.deletedAt ||
    product.store.status !== StoreStatus.ACTIVE ||
    !product.store.sellerProfile ||
    product.store.sellerProfile.deletedAt ||
    product.store.sellerProfile.status !== SellerProfileStatus.APPROVED
  ) {
    throw new BadRequestException('Product unavailable');
  }
}

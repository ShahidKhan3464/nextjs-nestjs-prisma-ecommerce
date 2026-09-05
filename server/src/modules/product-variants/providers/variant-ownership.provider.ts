import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { StoreStatus } from 'src/modules/stores/constants/store.constants';
import { VARIANT_OWNERSHIP_INCLUDE } from '../constants/product-variant.constants';
import { SellerProfileStatus } from 'src/modules/sellers/constants/seller.constants';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Ownership chain: User → SellerProfile → Store → Product → Variant.
 * Never trusts client-claimed product ownership.
 */
@Injectable()
export class VariantOwnershipProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async findOwnedStoreOrThrow(userId: number) {
    const store = await this.prisma.store.findFirst({
      where: {
        deletedAt: null,
        sellerProfile: { userId, deletedAt: null },
      },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        sellerProfile: {
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found for this seller');
    }

    return store;
  }

  public async findProductForManageOrThrow(productId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: {
        id: true,
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
                userId: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  public async findVariantForManageOrThrow(variantId: number) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: variantId },
      include: VARIANT_OWNERSHIP_INCLUDE,
    });

    if (!variant || variant.product.deletedAt) {
      throw new NotFoundException('Product variant not found');
    }

    return variant;
  }

  /**
   * Ensures the actor may manage variants on the product: owning approved seller.
   */
  public async assertCanManageProduct(
    productId: number,
    userId: number,
    roles: UserRole[],
  ) {
    const product = await this.findProductForManageOrThrow(productId);
    this.assertActorOwnsProduct(product, userId, roles);
    return product;
  }

  /**
   * Ensures the actor may manage the variant via its product's store ownership.
   */
  public async assertCanManageVariant(
    variantId: number,
    userId: number,
    roles: UserRole[],
  ) {
    const variant = await this.findVariantForManageOrThrow(variantId);
    this.assertActorOwnsProduct(variant.product, userId, roles);
    return variant;
  }

  private assertActorOwnsProduct(
    product: {
      store: {
        status: string;
        deletedAt: Date | null;
        sellerProfile: { userId: number; status: string };
      };
    },
    userId: number,
    _roles: UserRole[],
  ): void {
    if (product.store.sellerProfile.userId !== userId) {
      throw new ForbiddenException('You do not own this product');
    }

    if (product.store.sellerProfile.status !== SellerProfileStatus.APPROVED) {
      throw new ForbiddenException(
        'Only approved sellers may manage their product variants',
      );
    }

    if (product.store.deletedAt) {
      throw new ForbiddenException(
        'Cannot manage variants for a deleted store',
      );
    }

    if (product.store.status === StoreStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Suspended stores cannot create or modify variants',
      );
    }
  }
}

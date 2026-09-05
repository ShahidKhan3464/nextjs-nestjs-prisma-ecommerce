import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { StoreStatus } from 'src/modules/stores/constants/store.constants';
import { SellerProfileStatus } from 'src/modules/sellers/constants/seller.constants';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

const STORE_OWNERSHIP_INCLUDE = {
  sellerProfile: {
    select: {
      id: true,
      userId: true,
      status: true,
      businessName: true,
    },
  },
} as const;

const PRODUCT_OWNERSHIP_INCLUDE = {
  store: {
    include: STORE_OWNERSHIP_INCLUDE,
  },
} as const;

@Injectable()
export class ProductOwnershipProvider {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the non-deleted store owned by the user's SellerProfile. */
  public async findOwnedStoreOrThrow(userId: number) {
    const store = await this.prisma.store.findFirst({
      where: {
        deletedAt: null,
        sellerProfile: { userId, deletedAt: null },
      },
      include: STORE_OWNERSHIP_INCLUDE,
    });

    if (!store) {
      throw new NotFoundException('Store not found for this seller');
    }

    return store;
  }

  /**
   * Resolves the store a product must be created under.
   * Always uses the authenticated seller's owned store (ignores client storeId).
   */
  public async resolveStoreForCreate(
    userId: number,
    _roles: UserRole[],
    _storeIdFromClient?: number,
  ) {
    const store = await this.findOwnedStoreOrThrow(userId);

    if (store.sellerProfile.status !== SellerProfileStatus.APPROVED) {
      throw new ForbiddenException('Only approved sellers may create products');
    }

    this.assertStoreAllowsProductWrite(store);
    return store;
  }

  public async findProductOrThrow(
    productId: number,
    options?: { includeDeleted?: boolean },
  ) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
      include: PRODUCT_OWNERSHIP_INCLUDE,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Ensures the actor may manage the product: owning approved seller only.
   * Blocks mutations when the store is SUSPENDED unless allowSuspendedStore.
   */
  public async assertCanManage(
    productId: number,
    userId: number,
    _roles: UserRole[],
    options?: { includeDeleted?: boolean; allowSuspendedStore?: boolean },
  ) {
    const product = await this.findProductOrThrow(productId, {
      includeDeleted: options?.includeDeleted,
    });

    if (product.store.sellerProfile.userId !== userId) {
      throw new ForbiddenException('You do not own this product');
    }

    if (product.store.sellerProfile.status !== SellerProfileStatus.APPROVED) {
      throw new ForbiddenException(
        'Only approved sellers may manage their products',
      );
    }

    if (!options?.allowSuspendedStore) {
      this.assertStoreAllowsProductWrite(product.store);
    }

    return product;
  }

  public assertStoreAllowsProductWrite(store: {
    status: string;
    deletedAt?: Date | null;
  }): void {
    if (store.deletedAt) {
      throw new ForbiddenException(
        'Cannot manage products for a deleted store',
      );
    }

    if (store.status === StoreStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Suspended stores cannot create or modify products',
      );
    }
  }
}

import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { OrderWithRelations } from 'src/common/types/domain.types';
import { isSuperAdmin, hasAnyRole } from 'src/common/utils/authorization.util';
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

@Injectable()
export class OrderOwnershipProvider {
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

  /** Soft lookup for access checks (null when the seller has no store). */
  public async findOwnedStoreId(userId: number): Promise<number | null> {
    const store = await this.prisma.store.findFirst({
      where: {
        deletedAt: null,
        sellerProfile: { userId, deletedAt: null },
      },
      select: { id: true },
    });
    return store?.id ?? null;
  }

  /**
   * Buyer may view own orders; seller may view orders for their store;
   * SUPER_ADMIN may view any order.
   */
  public assertCanView(
    order: OrderWithRelations,
    userId: number,
    roles: UserRole[],
    ownedStoreId?: number | null,
  ): void {
    if (isSuperAdmin(roles)) {
      return;
    }

    if (order.userId === userId) {
      return;
    }

    if (
      hasAnyRole(roles, [UserRole.SELLER]) &&
      ownedStoreId !== undefined &&
      ownedStoreId !== null &&
      order.storeId === ownedStoreId
    ) {
      return;
    }

    throw new ForbiddenException('You do not have access to this order');
  }

  /**
   * Seller (approved, owns store) or SUPER_ADMIN may update order status.
   */
  public async assertCanManageStatus(
    order: OrderWithRelations,
    userId: number,
    roles: UserRole[],
  ): Promise<void> {
    if (isSuperAdmin(roles)) {
      return;
    }

    if (!hasAnyRole(roles, [UserRole.SELLER])) {
      throw new ForbiddenException(
        'Only sellers or administrators may update order status',
      );
    }

    const store = await this.findOwnedStoreOrThrow(userId);

    if (store.id !== order.storeId) {
      throw new ForbiddenException('You do not own this order');
    }

    if (store.sellerProfile.status !== SellerProfileStatus.APPROVED) {
      throw new ForbiddenException(
        'Only approved sellers may manage their orders',
      );
    }
  }

  /** Buyer owner or SUPER_ADMIN may cancel. */
  public assertCanCancel(
    order: OrderWithRelations,
    userId: number,
    roles: UserRole[],
  ): void {
    if (isSuperAdmin(roles)) {
      return;
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }
  }

  public shouldIncludeBuyer(roles: UserRole[]): boolean {
    return isSuperAdmin(roles) || hasAnyRole(roles, [UserRole.SELLER]);
  }
}

import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { STORE_INCLUDE } from '../constants/store.constants';
import { hasAnyRole } from 'src/common/utils/authorization.util';
import { StoreMapped, mapStoreToResponse } from '../utils/map-store.util';
import { SellerProfileStatus } from 'src/modules/sellers/constants/seller.constants';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class StoreOwnershipProvider {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the non-deleted store owned by the user's SellerProfile. */
  public async findOwnedStoreOrThrow(userId: number): Promise<StoreMapped> {
    const store = await this.prisma.store.findFirst({
      where: {
        deletedAt: null,
        sellerProfile: { userId, deletedAt: null },
      },
      include: STORE_INCLUDE,
    });

    if (!store) {
      throw new NotFoundException('Store not found for this seller');
    }

    return mapStoreToResponse(store);
  }

  /** Loads a non-deleted store by id with ownership context. */
  public async findStoreByIdOrThrow(storeId: number) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      include: STORE_INCLUDE,
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  /**
   * Ensures the actor may manage the store: owner (SELLER) or SUPER_ADMIN.
   * Returns the raw store row with includes.
   */
  public async assertCanManage(
    storeId: number,
    userId: number,
    roles: UserRole[],
  ) {
    const store = await this.findStoreByIdOrThrow(storeId);

    if (hasAnyRole(roles, [UserRole.SUPER_ADMIN])) {
      return store;
    }

    if (store.sellerProfile.userId !== userId) {
      throw new ForbiddenException('You do not own this store');
    }

    if (store.sellerProfile.status !== SellerProfileStatus.APPROVED) {
      throw new ForbiddenException(
        'Only approved sellers may manage their store',
      );
    }

    return store;
  }

  public assertNotSuspended(status: string): void {
    if (status === 'SUSPENDED') {
      throw new ForbiddenException('Suspended stores cannot be updated');
    }
  }
}

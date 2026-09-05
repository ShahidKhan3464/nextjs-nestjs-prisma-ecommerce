import { Injectable } from '@nestjs/common';
import type { StoreMapped } from '../types/store.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { STORE_INCLUDE } from '../constants/store.constants';
import { mapStoreToResponse } from '../utils/map-store.util';
import { StoreOwnershipProvider } from './store-ownership.provider';

@Injectable()
export class SoftDeleteStoreProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeOwnershipProvider: StoreOwnershipProvider,
  ) {}

  public async softDeleteMe(
    userId: number,
    roles: UserRole[],
  ): Promise<StoreMapped> {
    const owned =
      await this.storeOwnershipProvider.findOwnedStoreOrThrow(userId);
    return this.applySoftDelete(owned.id, userId, roles);
  }

  private async applySoftDelete(
    storeId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<StoreMapped> {
    const store = await this.storeOwnershipProvider.assertCanManage(
      storeId,
      userId,
      roles,
    );

    const updated = await this.prisma.store.update({
      where: { id: store.id },
      data: { deletedAt: new Date() },
      include: STORE_INCLUDE,
    });

    return mapStoreToResponse(updated);
  }
}

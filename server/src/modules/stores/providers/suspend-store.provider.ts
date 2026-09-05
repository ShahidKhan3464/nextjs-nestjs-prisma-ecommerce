import type { StoreMapped } from '../types/store.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { SuspendStoreDto } from '../dto/suspend-store.dto';
import { mapStoreToResponse } from '../utils/map-store.util';
import { Injectable, BadRequestException } from '@nestjs/common';
import { StoreOwnershipProvider } from './store-ownership.provider';
import { StoreStatus, STORE_INCLUDE } from '../constants/store.constants';

@Injectable()
export class SuspendStoreProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeOwnershipProvider: StoreOwnershipProvider,
  ) {}

  public async suspend(
    storeId: number,
    dto: SuspendStoreDto = {},
  ): Promise<StoreMapped> {
    const store =
      await this.storeOwnershipProvider.findStoreByIdOrThrow(storeId);

    if (store.status === StoreStatus.SUSPENDED) {
      throw new BadRequestException('Store is already suspended');
    }

    const updated = await this.prisma.store.update({
      where: { id: store.id },
      data: {
        suspendedAt: new Date(),
        status: StoreStatus.SUSPENDED,
        suspensionReason: dto.suspensionReason?.trim() || null,
      },
      include: STORE_INCLUDE,
    });

    return mapStoreToResponse(updated);
  }

  public async unsuspend(storeId: number): Promise<StoreMapped> {
    const store =
      await this.storeOwnershipProvider.findStoreByIdOrThrow(storeId);

    if (store.status !== StoreStatus.SUSPENDED) {
      throw new BadRequestException('Store is not suspended');
    }

    const updated = await this.prisma.store.update({
      where: { id: store.id },
      data: {
        suspendedAt: null,
        suspensionReason: null,
        status: StoreStatus.ACTIVE,
      },
      include: STORE_INCLUDE,
    });

    return mapStoreToResponse(updated);
  }
}

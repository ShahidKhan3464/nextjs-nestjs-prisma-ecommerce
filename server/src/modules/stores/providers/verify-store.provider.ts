import { PrismaService } from 'src/prisma/prisma.service';
import { STORE_INCLUDE } from '../constants/store.constants';
import { Injectable, BadRequestException } from '@nestjs/common';
import { StoreOwnershipProvider } from './store-ownership.provider';
import { StoreMapped, mapStoreToResponse } from '../utils/map-store.util';

@Injectable()
export class VerifyStoreProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeOwnershipProvider: StoreOwnershipProvider,
  ) {}

  public async verify(storeId: number): Promise<StoreMapped> {
    const store =
      await this.storeOwnershipProvider.findStoreByIdOrThrow(storeId);

    if (store.verifiedAt) {
      throw new BadRequestException('Store is already verified');
    }

    const updated = await this.prisma.store.update({
      where: { id: store.id },
      data: { verifiedAt: new Date() },
      include: STORE_INCLUDE,
    });

    return mapStoreToResponse(updated);
  }

  public async unverify(storeId: number): Promise<StoreMapped> {
    const store =
      await this.storeOwnershipProvider.findStoreByIdOrThrow(storeId);

    if (!store.verifiedAt) {
      throw new BadRequestException('Store is not verified');
    }

    const updated = await this.prisma.store.update({
      where: { id: store.id },
      data: { verifiedAt: null },
      include: STORE_INCLUDE,
    });

    return mapStoreToResponse(updated);
  }
}

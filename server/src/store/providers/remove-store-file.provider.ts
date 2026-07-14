import { join } from 'path';
import { unlink } from 'fs/promises';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Injectable, NotFoundException } from '@nestjs/common';
import { getUploadsRoot } from 'src/common/storage/uploads-root';
import { StoreOwnershipProvider } from './store-ownership.provider';
import { StoreMapped, mapStoreToResponse } from '../utils/map-store.util';
import { StoreFileType, STORE_INCLUDE } from '../constants/store.constants';

@Injectable()
export class RemoveStoreFileProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeOwnershipProvider: StoreOwnershipProvider,
  ) {}

  public async removeForOwner(
    userId: number,
    roles: UserRole[],
    type: StoreFileType,
  ): Promise<StoreMapped> {
    const owned =
      await this.storeOwnershipProvider.findOwnedStoreOrThrow(userId);
    return this.remove(owned.id, userId, roles, type);
  }

  public async remove(
    storeId: number,
    userId: number,
    roles: UserRole[],
    type: StoreFileType,
  ): Promise<StoreMapped> {
    const store = await this.storeOwnershipProvider.assertCanManage(
      storeId,
      userId,
      roles,
    );
    this.storeOwnershipProvider.assertNotSuspended(store.status);

    const existing = await this.prisma.storeFile.findMany({
      where: { storeId: store.id, type },
      include: { file: true },
    });

    if (existing.length === 0) {
      throw new NotFoundException(`Store ${type.toLowerCase()} not found`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const entry of existing) {
        await tx.storeFile.delete({ where: { id: entry.id } });
        await tx.storedFile.delete({ where: { id: entry.fileId } });
      }

      const result = await tx.store.findFirst({
        where: { id: store.id, deletedAt: null },
        include: STORE_INCLUDE,
      });

      if (!result) {
        throw new NotFoundException('Store not found');
      }

      return result;
    });

    for (const entry of existing) {
      await this.safeUnlink(entry.file.storageKey);
    }

    return mapStoreToResponse(updated);
  }

  private async safeUnlink(storageKey: string): Promise<void> {
    try {
      const abs = join(
        getUploadsRoot(),
        ...storageKey.split('/').filter(Boolean),
      );
      await unlink(abs);
    } catch {
      /* ignore cleanup errors */
    }
  }
}

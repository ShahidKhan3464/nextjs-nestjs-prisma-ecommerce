import { join } from 'path';
import { extname } from 'path';
import { unlink } from 'fs/promises';
import type { StoreMapped } from '../types/store.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { mapStoreToResponse } from '../utils/map-store.util';
import { Injectable, BadRequestException } from '@nestjs/common';
import { StoreOwnershipProvider } from './store-ownership.provider';
import { getUploadsRoot } from 'src/integrations/storage/uploads-root';
import {
  StoreFileType,
  STORE_INCLUDE,
  STORE_UPLOAD_SUBDIR,
} from '../constants/store.constants';

@Injectable()
export class UploadStoreFileProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeOwnershipProvider: StoreOwnershipProvider,
  ) {}

  public async uploadForOwner(
    userId: number,
    roles: UserRole[],
    type: StoreFileType,
    file: Express.Multer.File,
  ): Promise<StoreMapped> {
    const owned =
      await this.storeOwnershipProvider.findOwnedStoreOrThrow(userId);
    return this.upload(owned.id, userId, roles, type, file);
  }

  private async upload(
    storeId: number,
    userId: number,
    roles: UserRole[],
    type: StoreFileType,
    file: Express.Multer.File,
  ): Promise<StoreMapped> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const store = await this.storeOwnershipProvider.assertCanManage(
      storeId,
      userId,
      roles,
    );
    this.storeOwnershipProvider.assertNotSuspended(store.status);

    const extension =
      extname(file.originalname).replace('.', '').toLowerCase() ||
      extname(file.filename).replace('.', '').toLowerCase() ||
      'bin';

    const storageKey = `${STORE_UPLOAD_SUBDIR}/${file.filename}`;
    const urlPath = `/uploads/${STORE_UPLOAD_SUBDIR}/${file.filename}`;

    try {
      const { result, removedKeys } = await this.prisma.$transaction(
        async (tx) => {
          const existingOfType = await tx.storeFile.findMany({
            where: { storeId: store.id, type },
            include: { file: true },
          });

          for (const entry of existingOfType) {
            await tx.storeFile.delete({ where: { id: entry.id } });
            await tx.storedFile.delete({ where: { id: entry.fileId } });
          }

          const storedFile = await tx.storedFile.create({
            data: {
              urlPath,
              extension,
              storageKey,
              fileSize: file.size,
              mimeType: file.mimetype,
              storedName: file.filename,
              originalName: file.originalname,
            },
          });

          await tx.storeFile.create({
            data: {
              type,
              storeId: store.id,
              fileId: storedFile.id,
              sortOrder: type === StoreFileType.LOGO ? 0 : 1,
            },
          });

          const updatedStore = await tx.store.findFirst({
            where: { id: store.id, deletedAt: null },
            include: STORE_INCLUDE,
          });

          if (!updatedStore) {
            throw new BadRequestException('Store not found after file upload');
          }

          return {
            result: updatedStore,
            removedKeys: existingOfType.map((entry) => entry.file.storageKey),
          };
        },
      );

      for (const key of removedKeys) {
        await this.unlinkStorageKey(key);
      }

      return mapStoreToResponse(result);
    } catch (error) {
      try {
        await unlink(file.path);
      } catch {
        /* ignore cleanup errors */
      }
      throw error;
    }
  }

  private async unlinkStorageKey(storageKey: string): Promise<void> {
    try {
      await unlink(
        join(getUploadsRoot(), ...storageKey.split('/').filter(Boolean)),
      );
    } catch {
      /* ignore cleanup errors */
    }
  }
}

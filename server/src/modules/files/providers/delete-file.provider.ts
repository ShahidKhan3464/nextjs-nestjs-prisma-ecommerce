import { Inject } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FileAssociationProvider } from './file-association.provider';
import { FileAuthorizationProvider } from './file-authorization.provider';
import {
  STORAGE_PROVIDER,
  IStorageProvider,
} from 'src/integrations/storage/interfaces/storage-provider.interface';

export type DeleteFileResult = {
  deletedAssociationId: number;
  deletedStoredFile: boolean;
  fileId: number;
};

@Injectable()
export class DeleteFileProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly associations: FileAssociationProvider,
    private readonly authorization: FileAuthorizationProvider,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
  ) {}

  public async deleteProductFile(
    productId: number,
    associationId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<DeleteFileResult> {
    await this.authorization.assertCanManageProduct(productId, userId, roles);

    const entry = await this.prisma.productFile.findFirst({
      where: { id: associationId, productId },
      include: { file: true },
    });

    if (!entry) {
      throw new NotFoundException('Product file not found');
    }

    return this.deleteAssociationAndMaybeStoredFile({
      associationKind: 'product',
      associationId: entry.id,
      fileId: entry.fileId,
      storageKey: entry.file.storageKey,
    });
  }

  public async deleteStoreFile(
    storeId: number,
    associationId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<DeleteFileResult> {
    await this.authorization.assertCanManageStore(storeId, userId, roles);

    const entry = await this.prisma.storeFile.findFirst({
      where: { id: associationId, storeId },
      include: { file: true },
    });

    if (!entry) {
      throw new NotFoundException('Store file not found');
    }

    return this.deleteAssociationAndMaybeStoredFile({
      associationKind: 'store',
      associationId: entry.id,
      fileId: entry.fileId,
      storageKey: entry.file.storageKey,
    });
  }

  public async deleteUserFile(
    targetUserId: number,
    associationId: number,
    actorUserId: number,
    roles: UserRole[],
  ): Promise<DeleteFileResult> {
    await this.authorization.assertCanManageUser(
      targetUserId,
      actorUserId,
      roles,
    );

    const entry = await this.prisma.userFile.findFirst({
      where: { id: associationId, userId: targetUserId },
      include: { file: true },
    });

    if (!entry) {
      throw new NotFoundException('User file not found');
    }

    return this.deleteAssociationAndMaybeStoredFile({
      associationKind: 'user',
      associationId: entry.id,
      fileId: entry.fileId,
      storageKey: entry.file.storageKey,
    });
  }

  public async deleteSellerDocument(
    sellerProfileId: number,
    associationId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<DeleteFileResult> {
    await this.authorization.assertCanManageSellerProfile(
      sellerProfileId,
      userId,
      roles,
    );

    const entry = await this.prisma.sellerDocument.findFirst({
      where: { id: associationId, sellerProfileId },
      include: { file: true },
    });

    if (!entry) {
      throw new NotFoundException('Seller document not found');
    }

    return this.deleteAssociationAndMaybeStoredFile({
      associationKind: 'sellerDocument',
      associationId: entry.id,
      fileId: entry.fileId,
      storageKey: entry.file.storageKey,
    });
  }

  private async deleteAssociationAndMaybeStoredFile(params: {
    associationKind: 'product' | 'store' | 'user' | 'sellerDocument';
    associationId: number;
    fileId: number;
    storageKey: string;
  }): Promise<DeleteFileResult> {
    const { deletedStoredFile } = await this.prisma.$transaction(async (tx) => {
      switch (params.associationKind) {
        case 'product':
          await tx.productFile.delete({ where: { id: params.associationId } });
          break;
        case 'store':
          await tx.storeFile.delete({ where: { id: params.associationId } });
          break;
        case 'user':
          await tx.userFile.delete({ where: { id: params.associationId } });
          break;
        case 'sellerDocument':
          await tx.sellerDocument.delete({
            where: { id: params.associationId },
          });
          break;
      }

      const remaining = await this.associations.countAssociations(
        tx,
        params.fileId,
      );

      if (remaining === 0) {
        await tx.storedFile.delete({ where: { id: params.fileId } });
        return { deletedStoredFile: true };
      }

      return { deletedStoredFile: false };
    });

    if (deletedStoredFile) {
      await this.storage.deleteByStorageKey(params.storageKey);
    }

    return {
      deletedAssociationId: params.associationId,
      deletedStoredFile,
      fileId: params.fileId,
    };
  }
}

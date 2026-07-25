import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
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

  /**
   * Deletes by StoredFile id after verifying the actor owns at least one
   * association. Prefer association-scoped delete endpoints when possible.
   */
  public async deleteByStoredFileId(
    fileId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<DeleteFileResult> {
    const stored = await this.prisma.storedFile.findUnique({
      where: { id: fileId },
      include: {
        productFiles: true,
        storeFiles: true,
        userFiles: true,
        sellerDocuments: true,
      },
    });

    if (!stored) {
      throw new NotFoundException('Stored file not found');
    }

    const authorized =
      (await this.tryAuthorizeAnyAssociation(stored, userId, roles)) ?? false;

    if (!authorized) {
      throw new ForbiddenException('You cannot delete this file');
    }

    const storageKey = stored.storageKey;

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.productFile.deleteMany({ where: { fileId } });
      await tx.storeFile.deleteMany({ where: { fileId } });
      await tx.userFile.deleteMany({ where: { fileId } });
      await tx.sellerDocument.deleteMany({ where: { fileId } });
      await tx.storedFile.delete({ where: { id: fileId } });

      return {
        deletedAssociationId: 0,
        deletedStoredFile: true,
        fileId,
      };
    });

    await this.storage.deleteByStorageKey(storageKey);
    return result;
  }

  private async tryAuthorizeAnyAssociation(
    stored: {
      productFiles: { productId: number }[];
      storeFiles: { storeId: number }[];
      userFiles: { userId: number }[];
      sellerDocuments: { sellerProfileId: number }[];
    },
    userId: number,
    roles: UserRole[],
  ): Promise<boolean> {
    try {
      for (const entry of stored.productFiles) {
        await this.authorization.assertCanManageProduct(
          entry.productId,
          userId,
          roles,
        );
        return true;
      }
      for (const entry of stored.storeFiles) {
        await this.authorization.assertCanManageStore(
          entry.storeId,
          userId,
          roles,
        );
        return true;
      }
      for (const entry of stored.userFiles) {
        await this.authorization.assertCanManageUser(
          entry.userId,
          userId,
          roles,
        );
        return true;
      }
      for (const entry of stored.sellerDocuments) {
        await this.authorization.assertCanManageSellerProfile(
          entry.sellerProfileId,
          userId,
          roles,
        );
        return true;
      }
    } catch {
      return false;
    }
    return false;
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

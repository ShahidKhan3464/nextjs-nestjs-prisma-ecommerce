import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { FileValidationProvider } from './file-validation.provider';
import { FileAssociationProvider } from './file-association.provider';
import { FileAuthorizationProvider } from './file-authorization.provider';
import {
  UserFileType,
  StoreFileType,
  ProductFileType,
  FileUploadSubdir,
  SellerDocumentType,
  buildSecureFileUrlPath,
  isPrivateAssociationType,
} from '../constants/file.constants';
import {
  STORAGE_PROVIDER,
  IStorageProvider,
} from '../interfaces/storage-provider.interface';
import {
  FileAssociationMapped,
  mapAssociation,
} from '../utils/map-stored-file.util';

@Injectable()
export class UploadFileProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validation: FileValidationProvider,
    private readonly authorization: FileAuthorizationProvider,
    private readonly associations: FileAssociationProvider,
    @Inject(STORAGE_PROVIDER)
    private readonly storage: IStorageProvider,
  ) {}

  public async uploadProductFile(
    productId: number,
    userId: number,
    roles: UserRole[],
    type: ProductFileType,
    file: Express.Multer.File,
  ): Promise<FileAssociationMapped> {
    return this.persistWithCleanup(file, async () => {
      await this.validation.assertMagicBytes(file, 'image');
      await this.authorization.assertCanManageProduct(productId, userId, roles);

      const meta = this.storage.buildMetaFromMulterFile(
        file,
        FileUploadSubdir.PRODUCTS,
      );

      const { association, removedKeys } = await this.prisma.$transaction(
        async (tx) => {
          const removedKeys: string[] = [];

          if (type === ProductFileType.THUMBNAIL) {
            const existing = await tx.productFile.findMany({
              where: { productId, type: ProductFileType.THUMBNAIL },
              include: { file: true },
            });
            for (const entry of existing) {
              await tx.productFile.delete({ where: { id: entry.id } });
              const remaining = await this.associations.countAssociations(
                tx,
                entry.fileId,
              );
              if (remaining === 0) {
                removedKeys.push(entry.file.storageKey);
                await tx.storedFile.delete({ where: { id: entry.fileId } });
              }
            }
          }

          const aggregate = await tx.productFile.aggregate({
            where: { productId },
            _max: { sortOrder: true },
          });
          const sortOrder =
            type === ProductFileType.THUMBNAIL
              ? 0
              : (aggregate._max.sortOrder ?? -1) + 1;

          const storedFile = await tx.storedFile.create({ data: meta });
          const association = await this.associations.createProductFile(tx, {
            productId,
            fileId: storedFile.id,
            type,
            sortOrder,
          });

          return { association, removedKeys };
        },
      );

      await this.unlinkKeys(removedKeys);
      return mapAssociation(association);
    });
  }

  public async uploadStoreFile(
    storeId: number,
    userId: number,
    roles: UserRole[],
    type: StoreFileType,
    file: Express.Multer.File,
  ): Promise<FileAssociationMapped> {
    return this.persistWithCleanup(file, async () => {
      await this.validation.assertMagicBytes(file, 'image');
      await this.authorization.assertCanManageStore(storeId, userId, roles);

      const meta = this.storage.buildMetaFromMulterFile(
        file,
        FileUploadSubdir.STORES,
      );

      const { association, removedKeys } = await this.prisma.$transaction(
        async (tx) => {
          const existing = await tx.storeFile.findMany({
            where: { storeId, type },
            include: { file: true },
          });

          const removedKeys: string[] = [];
          for (const entry of existing) {
            await tx.storeFile.delete({ where: { id: entry.id } });
            const remaining = await this.associations.countAssociations(
              tx,
              entry.fileId,
            );
            if (remaining === 0) {
              removedKeys.push(entry.file.storageKey);
              await tx.storedFile.delete({ where: { id: entry.fileId } });
            }
          }

          const storedFile = await tx.storedFile.create({ data: meta });
          const association = await this.associations.createStoreFile(tx, {
            storeId,
            fileId: storedFile.id,
            type,
            sortOrder: type === StoreFileType.LOGO ? 0 : 1,
          });

          return { association, removedKeys };
        },
      );

      await this.unlinkKeys(removedKeys);
      return mapAssociation(association);
    });
  }

  public async uploadUserFile(
    targetUserId: number,
    actorUserId: number,
    roles: UserRole[],
    type: UserFileType,
    file: Express.Multer.File,
  ): Promise<FileAssociationMapped> {
    return this.persistWithCleanup(file, async () => {
      const profile = type === UserFileType.DOCUMENT ? 'document' : 'image';
      await this.validation.assertMagicBytes(file, profile);
      await this.authorization.assertCanManageUser(
        targetUserId,
        actorUserId,
        roles,
      );

      const subdir =
        type === UserFileType.DOCUMENT
          ? FileUploadSubdir.USER_DOCUMENTS
          : FileUploadSubdir.USERS;
      const meta = this.storage.buildMetaFromMulterFile(file, subdir);

      const { association, removedKeys } = await this.prisma.$transaction(
        async (tx) => {
          const removedKeys: string[] = [];

          if (type === UserFileType.AVATAR || type === UserFileType.COVER) {
            const existing = await tx.userFile.findMany({
              where: { userId: targetUserId, type },
              include: { file: true },
            });
            for (const entry of existing) {
              await tx.userFile.delete({ where: { id: entry.id } });
              const remaining = await this.associations.countAssociations(
                tx,
                entry.fileId,
              );
              if (remaining === 0) {
                removedKeys.push(entry.file.storageKey);
                await tx.storedFile.delete({ where: { id: entry.fileId } });
              }
            }
          }

          const aggregate = await tx.userFile.aggregate({
            where: { userId: targetUserId },
            _max: { sortOrder: true },
          });

          const storedFile = await tx.storedFile.create({ data: meta });
          if (isPrivateAssociationType(type)) {
            await tx.storedFile.update({
              where: { id: storedFile.id },
              data: { urlPath: buildSecureFileUrlPath(storedFile.id) },
            });
          }

          const association = await this.associations.createUserFile(tx, {
            userId: targetUserId,
            fileId: storedFile.id,
            type,
            sortOrder:
              type === UserFileType.AVATAR
                ? 0
                : type === UserFileType.COVER
                  ? 1
                  : (aggregate._max.sortOrder ?? 1) + 1,
          });

          return { association, removedKeys };
        },
      );

      await this.unlinkKeys(removedKeys);
      return mapAssociation(association);
    });
  }

  public async uploadSellerDocument(
    sellerProfileId: number,
    userId: number,
    roles: UserRole[],
    type: SellerDocumentType,
    file: Express.Multer.File,
  ): Promise<FileAssociationMapped> {
    return this.persistWithCleanup(file, async () => {
      await this.validation.assertMagicBytes(file, 'document');
      await this.authorization.assertCanManageSellerProfile(
        sellerProfileId,
        userId,
        roles,
      );

      const meta = this.storage.buildMetaFromMulterFile(
        file,
        FileUploadSubdir.SELLERS,
      );

      const association = await this.prisma.$transaction(async (tx) => {
        const storedFile = await tx.storedFile.create({ data: meta });
        await tx.storedFile.update({
          where: { id: storedFile.id },
          data: { urlPath: buildSecureFileUrlPath(storedFile.id) },
        });
        return this.associations.createSellerDocument(tx, {
          sellerProfileId,
          fileId: storedFile.id,
          type,
        });
      });

      return mapAssociation(association);
    });
  }

  private async persistWithCleanup<T>(
    file: Express.Multer.File,
    work: () => Promise<T>,
  ): Promise<T> {
    try {
      return await work();
    } catch (error) {
      await this.storage.deleteAbsolutePath(file.path);
      throw error;
    }
  }

  private async unlinkKeys(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.storage.deleteByStorageKey(key);
    }
  }
}

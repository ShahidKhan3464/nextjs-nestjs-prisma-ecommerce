import type { Response } from 'express';
import { Injectable } from '@nestjs/common';
import { StreamableFile } from '@nestjs/common';
import { UserRole } from 'src/common/enums/user-role.enum';
import { DeleteFileResult } from './providers/delete-file.provider';
import { UploadFileProvider } from './providers/upload-file.provider';
import { DeleteFileProvider } from './providers/delete-file.provider';
import { FileAssociationProvider } from './providers/file-association.provider';
import { SecureFileAccessProvider } from './providers/secure-file-access.provider';
import { FileAuthorizationProvider } from './providers/file-authorization.provider';
import {
  UserFileType,
  StoreFileType,
  ProductFileType,
  SellerDocumentType,
} from './constants/file.constants';
import {
  mapAssociation,
  FileAssociationMapped,
} from './utils/map-stored-file.util';

@Injectable()
export class FilesService {
  constructor(
    private readonly associations: FileAssociationProvider,
    private readonly uploadFileProvider: UploadFileProvider,
    private readonly deleteFileProvider: DeleteFileProvider,
    private readonly authorization: FileAuthorizationProvider,
    private readonly secureFileAccess: SecureFileAccessProvider,
  ) {}

  public streamSecureFile(
    fileId: number,
    userId: number,
    roles: UserRole[],
    res: Response,
  ): Promise<StreamableFile> {
    return this.secureFileAccess.streamSecureFile(fileId, userId, roles, res);
  }

  public uploadProductFile(
    productId: number,
    userId: number,
    roles: UserRole[],
    type: ProductFileType,
    file: Express.Multer.File,
  ): Promise<FileAssociationMapped> {
    return this.uploadFileProvider.uploadProductFile(
      productId,
      userId,
      roles,
      type,
      file,
    );
  }

  public uploadStoreFile(
    storeId: number,
    userId: number,
    roles: UserRole[],
    type: StoreFileType,
    file: Express.Multer.File,
  ): Promise<FileAssociationMapped> {
    return this.uploadFileProvider.uploadStoreFile(
      storeId,
      userId,
      roles,
      type,
      file,
    );
  }

  public async uploadMyStoreFile(
    userId: number,
    roles: UserRole[],
    type: StoreFileType,
    file: Express.Multer.File,
  ): Promise<FileAssociationMapped> {
    const storeId = await this.authorization.findOwnedStoreIdOrThrow(userId);
    return this.uploadStoreFile(storeId, userId, roles, type, file);
  }

  public uploadUserFile(
    targetUserId: number,
    actorUserId: number,
    roles: UserRole[],
    type: UserFileType,
    file: Express.Multer.File,
  ): Promise<FileAssociationMapped> {
    return this.uploadFileProvider.uploadUserFile(
      targetUserId,
      actorUserId,
      roles,
      type,
      file,
    );
  }

  public uploadMyUserFile(
    userId: number,
    roles: UserRole[],
    type: UserFileType,
    file: Express.Multer.File,
  ): Promise<FileAssociationMapped> {
    return this.uploadUserFile(userId, userId, roles, type, file);
  }

  public uploadSellerDocument(
    sellerProfileId: number,
    userId: number,
    roles: UserRole[],
    type: SellerDocumentType,
    file: Express.Multer.File,
  ): Promise<FileAssociationMapped> {
    return this.uploadFileProvider.uploadSellerDocument(
      sellerProfileId,
      userId,
      roles,
      type,
      file,
    );
  }

  public async uploadMySellerDocument(
    userId: number,
    roles: UserRole[],
    type: SellerDocumentType,
    file: Express.Multer.File,
  ): Promise<FileAssociationMapped> {
    const sellerProfileId =
      await this.authorization.findOwnedSellerProfileIdOrThrow(userId);
    return this.uploadSellerDocument(
      sellerProfileId,
      userId,
      roles,
      type,
      file,
    );
  }

  public deleteProductFile(
    productId: number,
    associationId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<DeleteFileResult> {
    return this.deleteFileProvider.deleteProductFile(
      productId,
      associationId,
      userId,
      roles,
    );
  }

  public deleteStoreFile(
    storeId: number,
    associationId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<DeleteFileResult> {
    return this.deleteFileProvider.deleteStoreFile(
      storeId,
      associationId,
      userId,
      roles,
    );
  }

  public async deleteMyStoreFile(
    associationId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<DeleteFileResult> {
    const storeId = await this.authorization.findOwnedStoreIdOrThrow(userId);
    return this.deleteStoreFile(storeId, associationId, userId, roles);
  }

  public deleteUserFile(
    targetUserId: number,
    associationId: number,
    actorUserId: number,
    roles: UserRole[],
  ): Promise<DeleteFileResult> {
    return this.deleteFileProvider.deleteUserFile(
      targetUserId,
      associationId,
      actorUserId,
      roles,
    );
  }

  public deleteMyUserFile(
    associationId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<DeleteFileResult> {
    return this.deleteUserFile(userId, associationId, userId, roles);
  }

  public deleteSellerDocument(
    sellerProfileId: number,
    associationId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<DeleteFileResult> {
    return this.deleteFileProvider.deleteSellerDocument(
      sellerProfileId,
      associationId,
      userId,
      roles,
    );
  }

  public async deleteMySellerDocument(
    associationId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<DeleteFileResult> {
    const sellerProfileId =
      await this.authorization.findOwnedSellerProfileIdOrThrow(userId);
    return this.deleteSellerDocument(
      sellerProfileId,
      associationId,
      userId,
      roles,
    );
  }

  public async listProductFiles(
    productId: number,
  ): Promise<FileAssociationMapped[]> {
    const rows = await this.associations.listProductFiles(productId);
    return rows.map(mapAssociation);
  }

  public async listStoreFiles(
    storeId: number,
  ): Promise<FileAssociationMapped[]> {
    const rows = await this.associations.listStoreFiles(storeId);
    return rows.map(mapAssociation);
  }

  public async listMyStoreFiles(
    userId: number,
  ): Promise<FileAssociationMapped[]> {
    const storeId = await this.authorization.findOwnedStoreIdOrThrow(userId);
    return this.listStoreFiles(storeId);
  }

  public async listUserFiles(userId: number): Promise<FileAssociationMapped[]> {
    const rows = await this.associations.listUserFiles(userId);
    return rows.map(mapAssociation);
  }

  public async listSellerDocuments(
    sellerProfileId: number,
  ): Promise<FileAssociationMapped[]> {
    const rows = await this.associations.listSellerDocuments(sellerProfileId);
    return rows.map((row) =>
      mapAssociation({
        id: row.id,
        type: row.type,
        file: row.file,
      }),
    );
  }

  public async listMySellerDocuments(
    userId: number,
  ): Promise<FileAssociationMapped[]> {
    const sellerProfileId =
      await this.authorization.findOwnedSellerProfileIdOrThrow(userId);
    return this.listSellerDocuments(sellerProfileId);
  }
}

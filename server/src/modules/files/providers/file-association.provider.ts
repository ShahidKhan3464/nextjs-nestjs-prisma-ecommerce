import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  UserFileType,
  StoreFileType,
  ProductFileType,
  SellerDocumentType,
  STORED_FILE_SELECT,
} from '../constants/file.constants';

type TxClient = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

export type AssociationKind = 'product' | 'store' | 'user' | 'sellerDocument';

@Injectable()
export class FileAssociationProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async createProductFile(
    tx: TxClient,
    params: {
      productId: number;
      fileId: number;
      type: ProductFileType;
      sortOrder: number;
    },
  ) {
    return tx.productFile.create({
      data: {
        productId: params.productId,
        fileId: params.fileId,
        type: params.type,
        sortOrder: params.sortOrder,
      },
      include: { file: { select: STORED_FILE_SELECT } },
    });
  }

  public async createStoreFile(
    tx: TxClient,
    params: {
      storeId: number;
      fileId: number;
      type: StoreFileType;
      sortOrder: number;
    },
  ) {
    return tx.storeFile.create({
      data: {
        storeId: params.storeId,
        fileId: params.fileId,
        type: params.type,
        sortOrder: params.sortOrder,
      },
      include: { file: { select: STORED_FILE_SELECT } },
    });
  }

  public async createUserFile(
    tx: TxClient,
    params: {
      userId: number;
      fileId: number;
      type: UserFileType;
      sortOrder: number;
    },
  ) {
    return tx.userFile.create({
      data: {
        userId: params.userId,
        fileId: params.fileId,
        type: params.type,
        sortOrder: params.sortOrder,
      },
      include: { file: { select: STORED_FILE_SELECT } },
    });
  }

  public async createSellerDocument(
    tx: TxClient,
    params: {
      sellerProfileId: number;
      fileId: number;
      type: SellerDocumentType;
    },
  ) {
    return tx.sellerDocument.create({
      data: {
        sellerProfileId: params.sellerProfileId,
        fileId: params.fileId,
        type: params.type,
      },
      include: { file: { select: STORED_FILE_SELECT } },
    });
  }

  /** Batch-load product file associations for listing. */
  public async listProductFiles(productId: number) {
    return this.prisma.productFile.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' },
      include: { file: { select: STORED_FILE_SELECT } },
    });
  }

  public async listStoreFiles(storeId: number) {
    return this.prisma.storeFile.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
      include: { file: { select: STORED_FILE_SELECT } },
    });
  }

  public async listUserFiles(userId: number) {
    return this.prisma.userFile.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
      include: { file: { select: STORED_FILE_SELECT } },
    });
  }

  public async listSellerDocuments(sellerProfileId: number) {
    return this.prisma.sellerDocument.findMany({
      where: { sellerProfileId },
      orderBy: { id: 'asc' },
      include: { file: { select: STORED_FILE_SELECT } },
    });
  }

  /**
   * Counts remaining associations for a StoredFile across all join tables.
   * Used to decide whether the StoredFile row (and disk object) may be removed.
   */
  public async countAssociations(
    tx: TxClient,
    fileId: number,
  ): Promise<number> {
    const [product, store, user, seller] = await Promise.all([
      tx.productFile.count({ where: { fileId } }),
      tx.storeFile.count({ where: { fileId } }),
      tx.userFile.count({ where: { fileId } }),
      tx.sellerDocument.count({ where: { fileId } }),
    ]);
    return product + store + user + seller;
  }
}

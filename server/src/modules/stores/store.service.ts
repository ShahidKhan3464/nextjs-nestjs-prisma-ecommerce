import { Injectable } from '@nestjs/common';
import { StoreMapped } from './utils/map-store.util';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { QueryStoresDto } from './dto/query-stores.dto';
import { SuspendStoreDto } from './dto/suspend-store.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { StoreFileType } from './constants/store.constants';
import { GetStoresProvider } from './providers/get-stores.provider';
import { CreateStoreProvider } from './providers/create-store.provider';
import { UpdateStoreProvider } from './providers/update-store.provider';
import { VerifyStoreProvider } from './providers/verify-store.provider';
import { SuspendStoreProvider } from './providers/suspend-store.provider';
import { SoftDeleteStoreProvider } from './providers/soft-delete-store.provider';
import { UploadStoreFileProvider } from './providers/upload-store-file.provider';
import { RemoveStoreFileProvider } from './providers/remove-store-file.provider';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';

@Injectable()
export class StoreService {
  constructor(
    private readonly getStoresProvider: GetStoresProvider,
    private readonly createStoreProvider: CreateStoreProvider,
    private readonly updateStoreProvider: UpdateStoreProvider,
    private readonly verifyStoreProvider: VerifyStoreProvider,
    private readonly suspendStoreProvider: SuspendStoreProvider,
    private readonly softDeleteStoreProvider: SoftDeleteStoreProvider,
    private readonly uploadStoreFileProvider: UploadStoreFileProvider,
    private readonly removeStoreFileProvider: RemoveStoreFileProvider,
  ) {}

  /**
   * Creates a store for an APPROVED SellerProfile.
   * Not exposed via controllers — call from services / admin flows only.
   */
  public createForApprovedSeller(
    sellerProfileId: number,
    dto: CreateStoreDto,
  ): Promise<StoreMapped> {
    return this.createStoreProvider.create(sellerProfileId, dto);
  }

  public getMyStore(userId: number): Promise<StoreMapped> {
    return this.getStoresProvider.findMe(userId);
  }

  public getById(id: number): Promise<StoreMapped> {
    return this.getStoresProvider.findById(id);
  }

  public getBySlug(slug: string): Promise<StoreMapped> {
    return this.getStoresProvider.findBySlug(slug);
  }

  public listStores(
    query: QueryStoresDto,
  ): Promise<PaginateQueryResult<StoreMapped>> {
    return this.getStoresProvider.findAllPaginated(query);
  }

  public updateMyStore(
    userId: number,
    roles: UserRole[],
    dto: UpdateStoreDto,
  ): Promise<StoreMapped> {
    return this.updateStoreProvider.updateMe(userId, roles, dto);
  }

  public updateStore(
    storeId: number,
    userId: number,
    roles: UserRole[],
    dto: UpdateStoreDto,
  ): Promise<StoreMapped> {
    return this.updateStoreProvider.updateById(storeId, userId, roles, dto);
  }

  public softDeleteMyStore(
    userId: number,
    roles: UserRole[],
  ): Promise<StoreMapped> {
    return this.softDeleteStoreProvider.softDeleteMe(userId, roles);
  }

  public softDeleteStore(
    storeId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<StoreMapped> {
    return this.softDeleteStoreProvider.softDeleteById(storeId, userId, roles);
  }

  public suspendStore(
    storeId: number,
    dto: SuspendStoreDto,
  ): Promise<StoreMapped> {
    return this.suspendStoreProvider.suspend(storeId, dto);
  }

  public unsuspendStore(storeId: number): Promise<StoreMapped> {
    return this.suspendStoreProvider.unsuspend(storeId);
  }

  public verifyStore(storeId: number): Promise<StoreMapped> {
    return this.verifyStoreProvider.verify(storeId);
  }

  public unverifyStore(storeId: number): Promise<StoreMapped> {
    return this.verifyStoreProvider.unverify(storeId);
  }

  public uploadMyStoreFile(
    userId: number,
    roles: UserRole[],
    type: StoreFileType,
    file: Express.Multer.File,
  ): Promise<StoreMapped> {
    return this.uploadStoreFileProvider.uploadForOwner(
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
  ): Promise<StoreMapped> {
    return this.uploadStoreFileProvider.upload(
      storeId,
      userId,
      roles,
      type,
      file,
    );
  }

  public removeMyStoreFile(
    userId: number,
    roles: UserRole[],
    type: StoreFileType,
  ): Promise<StoreMapped> {
    return this.removeStoreFileProvider.removeForOwner(userId, roles, type);
  }

  public removeStoreFile(
    storeId: number,
    userId: number,
    roles: UserRole[],
    type: StoreFileType,
  ): Promise<StoreMapped> {
    return this.removeStoreFileProvider.remove(storeId, userId, roles, type);
  }
}

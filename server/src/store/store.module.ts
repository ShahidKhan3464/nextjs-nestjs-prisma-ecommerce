import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { GetStoresProvider } from './providers/get-stores.provider';
import { CreateStoreProvider } from './providers/create-store.provider';
import { UpdateStoreProvider } from './providers/update-store.provider';
import { VerifyStoreProvider } from './providers/verify-store.provider';
import { SuspendStoreProvider } from './providers/suspend-store.provider';
import { StoreOwnershipProvider } from './providers/store-ownership.provider';
import { SoftDeleteStoreProvider } from './providers/soft-delete-store.provider';
import { UploadStoreFileProvider } from './providers/upload-store-file.provider';
import { RemoveStoreFileProvider } from './providers/remove-store-file.provider';

@Module({
  controllers: [StoreController],
  providers: [
    StoreService,
    GetStoresProvider,
    CreateStoreProvider,
    UpdateStoreProvider,
    VerifyStoreProvider,
    SuspendStoreProvider,
    StoreOwnershipProvider,
    SoftDeleteStoreProvider,
    UploadStoreFileProvider,
    RemoveStoreFileProvider,
  ],
  exports: [StoreService],
})
export class StoreModule {}

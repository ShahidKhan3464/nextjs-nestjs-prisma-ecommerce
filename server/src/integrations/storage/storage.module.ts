import { Module } from '@nestjs/common';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { STORAGE_PROVIDER } from './interfaces/storage-provider.interface';

/**
 * Local disk storage adapter. Domain upload orchestration stays in FilesModule.
 * Swap STORAGE_PROVIDER binding here for S3/R2 later without changing domain code.
 */
@Module({
  providers: [
    LocalStorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useExisting: LocalStorageProvider,
    },
  ],
  exports: [LocalStorageProvider, STORAGE_PROVIDER],
})
export class StorageModule {}

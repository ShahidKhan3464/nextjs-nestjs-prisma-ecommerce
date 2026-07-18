import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { UploadedFileGuard } from './guards/uploaded-file.guard';
import { UploadFileProvider } from './providers/upload-file.provider';
import { DeleteFileProvider } from './providers/delete-file.provider';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { STORAGE_PROVIDER } from './interfaces/storage-provider.interface';
import { FileValidationProvider } from './providers/file-validation.provider';
import { FileAssociationProvider } from './providers/file-association.provider';
import { SecureFileAccessProvider } from './providers/secure-file-access.provider';
import { FileAuthorizationProvider } from './providers/file-authorization.provider';

@Module({
  controllers: [FilesController],
  providers: [
    FilesService,
    UploadedFileGuard,
    UploadFileProvider,
    DeleteFileProvider,
    LocalStorageProvider,
    FileValidationProvider,
    FileAssociationProvider,
    SecureFileAccessProvider,
    FileAuthorizationProvider,
    {
      provide: STORAGE_PROVIDER,
      useExisting: LocalStorageProvider,
    },
  ],
  exports: [
    FilesService,
    STORAGE_PROVIDER,
    UploadFileProvider,
    DeleteFileProvider,
    LocalStorageProvider,
    FileValidationProvider,
    FileAssociationProvider,
    FileAuthorizationProvider,
  ],
})
export class FilesModule {}

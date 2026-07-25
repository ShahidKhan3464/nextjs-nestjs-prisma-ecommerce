import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { UploadedFileGuard } from './guards/uploaded-file.guard';
import { UploadFileProvider } from './providers/upload-file.provider';
import { DeleteFileProvider } from './providers/delete-file.provider';
import { StorageModule } from 'src/integrations/storage/storage.module';
import { FileValidationProvider } from './providers/file-validation.provider';
import { FileAssociationProvider } from './providers/file-association.provider';
import { SecureFileAccessProvider } from './providers/secure-file-access.provider';
import { FileAuthorizationProvider } from './providers/file-authorization.provider';
import { STORAGE_PROVIDER } from 'src/integrations/storage/interfaces/storage-provider.interface';

@Module({
  imports: [StorageModule],
  controllers: [FilesController],
  providers: [
    FilesService,
    UploadedFileGuard,
    UploadFileProvider,
    DeleteFileProvider,
    FileValidationProvider,
    FileAssociationProvider,
    SecureFileAccessProvider,
    FileAuthorizationProvider,
  ],
  exports: [
    FilesService,
    StorageModule,
    STORAGE_PROVIDER,
    UploadFileProvider,
    DeleteFileProvider,
    FileValidationProvider,
    FileAssociationProvider,
    FileAuthorizationProvider,
  ],
})
export class FilesModule {}

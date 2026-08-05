export { StorageModule } from './storage.module';
export { getUploadsRoot, UploadSubdir } from './uploads-root';
export { STORAGE_PROVIDER } from './interfaces/storage-provider.interface';
export type { IStorageProvider } from './interfaces/storage-provider.interface';
export {
  IMAGE_MAX_BYTES,
  IMAGE_MIME_REGEX,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MIME_REGEX,
} from './constants/storage.constants';

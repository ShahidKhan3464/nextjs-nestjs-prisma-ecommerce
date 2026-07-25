import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadSubdir } from '../constants/file.constants';
import { createFileDiskMulterOptions } from './shared-multer.config';

const storeFileMulter = createFileDiskMulterOptions(
  FileUploadSubdir.STORES,
  'image',
);

/** Store logo / banner upload (`file` field). */
export function StoreFileUploadInterceptor(fieldName = 'file') {
  return FileInterceptor(fieldName, storeFileMulter);
}

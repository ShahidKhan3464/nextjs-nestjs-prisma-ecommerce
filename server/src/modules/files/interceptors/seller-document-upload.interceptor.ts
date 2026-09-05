import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadSubdir } from '../constants/file.constants';
import { createFileDiskMulterOptions } from './shared-multer.config';

const sellerDocumentMulter = createFileDiskMulterOptions(
  FileUploadSubdir.SELLERS,
  'document',
);

/** Seller verification document upload (`file` field). */
export function SellerDocumentUploadInterceptor(fieldName = 'file') {
  return FileInterceptor(fieldName, sellerDocumentMulter);
}

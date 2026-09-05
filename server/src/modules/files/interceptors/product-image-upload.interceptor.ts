import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadSubdir } from '../constants/file.constants';
import { createFileDiskMulterOptions } from './shared-multer.config';

const productImageMulter = createFileDiskMulterOptions(
  FileUploadSubdir.PRODUCTS,
  'image',
);

/** Single product image upload (`file` field). */
export function ProductImageUploadInterceptor(fieldName = 'file') {
  return FileInterceptor(fieldName, productImageMulter);
}

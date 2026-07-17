import { FileUploadSubdir } from '../constants/file.constants';
import { createFileDiskMulterOptions } from './shared-multer.config';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

const productImageMulter = createFileDiskMulterOptions(
  FileUploadSubdir.PRODUCTS,
  'image',
);

/** Single product image upload (`file` field). */
export function ProductImageUploadInterceptor(fieldName = 'file') {
  return FileInterceptor(fieldName, productImageMulter);
}

/** Multi product image upload (create/update product flows). */
export function ProductImagesUploadInterceptor(
  fieldName = 'images',
  maxCount = 12,
) {
  return FilesInterceptor(fieldName, maxCount, productImageMulter);
}

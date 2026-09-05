import { extname } from 'path';
import { PRODUCT_UPLOAD_SUBDIR } from '../constants/product.constants';

/** Builds StoredFile create data from a Multer disk upload. */
export function buildProductStoredFileData(file: Express.Multer.File) {
  const extension =
    extname(file.originalname).replace('.', '').toLowerCase() ||
    extname(file.filename).replace('.', '').toLowerCase() ||
    'bin';

  const storageKey = `${PRODUCT_UPLOAD_SUBDIR}/${file.filename}`;

  return {
    extension,
    storageKey,
    fileSize: file.size,
    mimeType: file.mimetype,
    storedName: file.filename,
    originalName: file.originalname,
    urlPath: `/uploads/${PRODUCT_UPLOAD_SUBDIR}/${file.filename}`,
  };
}

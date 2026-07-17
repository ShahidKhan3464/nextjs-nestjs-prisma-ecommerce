import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadSubdir } from '../constants/file.constants';
import { createFileDiskMulterOptions } from './shared-multer.config';

const userImageMulter = createFileDiskMulterOptions(
  FileUploadSubdir.USERS,
  'image',
);

const userDocumentMulter = createFileDiskMulterOptions(
  FileUploadSubdir.USERS,
  'document',
);

/** User avatar / cover image upload. */
export function UserFileUploadInterceptor(fieldName = 'file') {
  return FileInterceptor(fieldName, userImageMulter);
}

/**
 * User document upload (PDF + images). Use when `type=DOCUMENT`.
 * Controllers that accept mixed types should prefer the document profile
 * (superset) or validate type in the service after upload.
 */
export function UserDocumentUploadInterceptor(fieldName = 'file') {
  return FileInterceptor(fieldName, userDocumentMulter);
}

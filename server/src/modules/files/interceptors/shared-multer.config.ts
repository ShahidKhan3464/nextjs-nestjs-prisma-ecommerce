import { join } from 'path';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';
import { getUploadsRoot } from 'src/integrations/storage/uploads-root';
import { wrapDiskStorageWithSignatureCheck } from 'src/integrations/storage/file-signature';
import { LocalStorageProvider } from 'src/integrations/storage/providers/local-storage.provider';
import {
  IMAGE_MAX_BYTES,
  IMAGE_MIME_TYPES,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MIME_TYPES,
  FileUploadSubdirValue,
} from '../constants/file.constants';

export type MulterUploadProfile = 'image' | 'document';

/**
 * Shared Multer disk configuration used by all file upload interceptors.
 * Filenames are UUID-based — never trust the client original name on disk.
 */
export function createFileDiskMulterOptions(
  subdir: FileUploadSubdirValue,
  profile: MulterUploadProfile,
) {
  const uploadsRoot = getUploadsRoot();
  const destDir = join(uploadsRoot, subdir);
  const allowedMimes =
    profile === 'image' ? IMAGE_MIME_TYPES : DOCUMENT_MIME_TYPES;
  const maxBytes = profile === 'image' ? IMAGE_MAX_BYTES : DOCUMENT_MAX_BYTES;

  return {
    storage: wrapDiskStorageWithSignatureCheck(
      diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
          }
          cb(null, destDir);
        },
        filename: (_req, file, cb) => {
          cb(null, LocalStorageProvider.buildUuidFilename(file.originalname));
        },
      }),
      profile,
    ),
    limits: { fileSize: maxBytes },
    fileFilter: (
      _req: unknown,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      const mime = (file.mimetype ?? '').toLowerCase();
      if (!(allowedMimes as readonly string[]).includes(mime)) {
        cb(
          new BadRequestException(
            profile === 'image'
              ? 'Only image files are allowed (jpeg, png, gif, webp)'
              : 'Only PDF and image files are allowed (jpeg, png, webp, pdf)',
          ),
          false,
        );
        return;
      }
      cb(null, true);
    },
  };
}

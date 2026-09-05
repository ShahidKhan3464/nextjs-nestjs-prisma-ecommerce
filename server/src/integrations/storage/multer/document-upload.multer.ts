import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';
import { wrapDiskStorageWithSignatureCheck } from '../file-signature';
import {
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MIME_REGEX,
} from '../constants/storage.constants';

/**
 * Disk storage for seller verification documents under `{uploadsRoot}/{subdir}/`.
 * Accepts images and PDF (max 10MB). Filenames are UUID-based.
 */
export function createDocumentDiskMulterOptions(
  uploadsRoot: string,
  subdir: string,
) {
  const destDir = join(uploadsRoot, subdir);
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
          const safeExt =
            file.originalname
              .match(/\.[a-zA-Z0-9]{1,8}$/)?.[0]
              ?.toLowerCase() ??
            (extname(file.originalname).toLowerCase() || '');
          cb(null, `${randomUUID()}${safeExt}`);
        },
      }),
      'document',
    ),
    limits: { fileSize: DOCUMENT_MAX_BYTES },
    fileFilter: (
      _req: unknown,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!DOCUMENT_MIME_REGEX.test(file.mimetype)) {
        cb(
          new BadRequestException(
            'Only PDF and image files are allowed (jpeg, png, webp, pdf)',
          ),
          false,
        );
        return;
      }
      cb(null, true);
    },
  };
}

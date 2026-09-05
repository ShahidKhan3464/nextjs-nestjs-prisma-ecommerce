import { join } from 'path';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';
import { wrapDiskStorageWithSignatureCheck } from '../file-signature';
import {
  IMAGE_MAX_BYTES,
  IMAGE_MIME_REGEX,
} from '../constants/storage.constants';

/**
 * Disk storage for validated image uploads under `{uploadsRoot}/{subdir}/`.
 * Filenames are UUID-based — never trust the client original name on disk.
 */
export function createImageDiskMulterOptions(
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
              ?.toLowerCase() ?? '';
          cb(null, `${randomUUID()}${safeExt}`);
        },
      }),
      'image',
    ),
    limits: { fileSize: IMAGE_MAX_BYTES },
    fileFilter: (
      _req: unknown,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!IMAGE_MIME_REGEX.test(file.mimetype)) {
        cb(
          new BadRequestException(
            'Only image files are allowed (jpeg, png, gif, webp)',
          ),
          false,
        );
        return;
      }
      cb(null, true);
    },
  };
}

import { extname, join } from 'path';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

const DOCUMENT_MIME = /^(image\/(jpeg|jpg|png|webp)|application\/pdf)$/i;

/**
 * Disk storage for seller verification documents under `{uploadsRoot}/{subdir}/`.
 * Accepts images and PDF (max 10MB).
 */
export function createDocumentDiskMulterOptions(
  uploadsRoot: string,
  subdir: string,
) {
  const destDir = join(uploadsRoot, subdir);
  return {
    storage: diskStorage({
      destination: (_req, _file, cb) => {
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true });
        }
        cb(null, destDir);
      },
      filename: (_req, file, cb) => {
        const safeExt =
          file.originalname.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ??
          (extname(file.originalname) || '');
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
        cb(null, unique);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (
      _req: unknown,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!DOCUMENT_MIME.test(file.mimetype)) {
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

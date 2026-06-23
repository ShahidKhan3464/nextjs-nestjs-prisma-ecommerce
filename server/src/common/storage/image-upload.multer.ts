import { join } from 'path';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';

const IMAGE_MIME = /^image\/(jpeg|jpg|png|gif|webp)$/i;

/**
 * Disk storage for validated image uploads under `{uploadsRoot}/{subdir}/`.
 * Reuse for products today and user profile images later (different `subdir`).
 */
export function createImageDiskMulterOptions(
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
          file.originalname.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ?? '';
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
        cb(null, unique);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (
      _req: unknown,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (!IMAGE_MIME.test(file.mimetype)) {
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

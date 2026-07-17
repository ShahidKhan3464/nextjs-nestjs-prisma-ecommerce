import { extname } from 'path';
import { Injectable, BadRequestException } from '@nestjs/common';
import {
  IMAGE_MAX_BYTES,
  IMAGE_MIME_TYPES,
  IMAGE_EXTENSIONS,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MIME_TYPES,
  DOCUMENT_EXTENSIONS,
} from '../constants/file.constants';

export type FileValidationProfile = 'image' | 'document';

@Injectable()
export class FileValidationProvider {
  public assertPresent(
    file?: Express.Multer.File,
  ): asserts file is Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
  }

  public assertValid(
    file: Express.Multer.File,
    profile: FileValidationProfile,
  ): void {
    this.assertPresent(file);

    const allowedMimes =
      profile === 'image' ? IMAGE_MIME_TYPES : DOCUMENT_MIME_TYPES;
    const allowedExts =
      profile === 'image' ? IMAGE_EXTENSIONS : DOCUMENT_EXTENSIONS;
    const maxBytes = profile === 'image' ? IMAGE_MAX_BYTES : DOCUMENT_MAX_BYTES;

    if (file.size <= 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    if (file.size > maxBytes) {
      throw new BadRequestException(
        `File exceeds maximum size of ${Math.floor(maxBytes / (1024 * 1024))}MB`,
      );
    }

    const mime = (file.mimetype ?? '').toLowerCase();
    if (!(allowedMimes as readonly string[]).includes(mime)) {
      throw new BadRequestException(
        profile === 'image'
          ? 'Only image files are allowed (jpeg, png, gif, webp)'
          : 'Only PDF and image files are allowed (jpeg, png, webp, pdf)',
      );
    }

    const extension = this.resolveExtension(file);
    if (!(allowedExts as readonly string[]).includes(extension)) {
      throw new BadRequestException(
        `File extension ".${extension}" is not allowed`,
      );
    }
  }

  public resolveExtension(file: Express.Multer.File): string {
    const fromStored = extname(file.filename).replace('.', '').toLowerCase();
    const fromOriginal = extname(file.originalname)
      .replace('.', '')
      .toLowerCase();
    return fromStored || fromOriginal || 'bin';
  }
}

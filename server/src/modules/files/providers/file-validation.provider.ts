import { extname } from 'path';
import { readFile } from 'fs/promises';
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

type DetectedKind = 'jpeg' | 'png' | 'gif' | 'webp' | 'pdf';

const MIME_BY_KIND: Record<DetectedKind, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

const EXT_BY_KIND: Record<DetectedKind, readonly string[]> = {
  jpeg: ['jpg', 'jpeg'],
  png: ['png'],
  gif: ['gif'],
  webp: ['webp'],
  pdf: ['pdf'],
};

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

  /**
   * Validates magic bytes against declared MIME/extension.
   * Call after Multer has written the file to disk (or when buffer is present).
   */
  public async assertMagicBytes(
    file: Express.Multer.File,
    profile: FileValidationProfile,
  ): Promise<void> {
    this.assertValid(file, profile);

    const header = await this.readHeaderBytes(file, 16);
    const kind = this.detectKind(header);

    if (!kind) {
      throw new BadRequestException(
        'File content does not match an allowed type',
      );
    }

    if (profile === 'image' && kind === 'pdf') {
      throw new BadRequestException(
        'Only image files are allowed (jpeg, png, gif, webp)',
      );
    }

    const expectedMime = MIME_BY_KIND[kind];
    const declaredMime = (file.mimetype ?? '').toLowerCase();
    const normalizedDeclared =
      declaredMime === 'image/jpg' ? 'image/jpeg' : declaredMime;

    if (normalizedDeclared !== expectedMime) {
      throw new BadRequestException(
        'File content does not match the declared MIME type',
      );
    }

    const extension = this.resolveExtension(file);
    if (!EXT_BY_KIND[kind].includes(extension)) {
      throw new BadRequestException(
        'File content does not match the file extension',
      );
    }
  }

  public resolveExtension(file: Express.Multer.File): string {
    const fromStored = extname(file.filename ?? '')
      .replace('.', '')
      .toLowerCase();
    const fromOriginal = extname(file.originalname)
      .replace('.', '')
      .toLowerCase();
    return fromStored || fromOriginal || 'bin';
  }

  private async readHeaderBytes(
    file: Express.Multer.File,
    length: number,
  ): Promise<Buffer> {
    if (file.buffer && file.buffer.length > 0) {
      return file.buffer.subarray(0, length);
    }

    if (file.path) {
      const fd = await readFile(file.path);
      return fd.subarray(0, length);
    }

    throw new BadRequestException('Unable to read uploaded file');
  }

  private detectKind(header: Buffer): DetectedKind | null {
    if (
      header.length >= 3 &&
      header[0] === 0xff &&
      header[1] === 0xd8 &&
      header[2] === 0xff
    ) {
      return 'jpeg';
    }

    if (
      header.length >= 8 &&
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47 &&
      header[4] === 0x0d &&
      header[5] === 0x0a &&
      header[6] === 0x1a &&
      header[7] === 0x0a
    ) {
      return 'png';
    }

    if (
      header.length >= 6 &&
      header[0] === 0x47 &&
      header[1] === 0x49 &&
      header[2] === 0x46 &&
      header[3] === 0x38 &&
      (header[4] === 0x37 || header[4] === 0x39) &&
      header[5] === 0x61
    ) {
      return 'gif';
    }

    if (
      header.length >= 12 &&
      header.toString('ascii', 0, 4) === 'RIFF' &&
      header.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return 'webp';
    }

    if (header.length >= 5 && header.toString('ascii', 0, 5) === '%PDF-') {
      return 'pdf';
    }

    return null;
  }
}

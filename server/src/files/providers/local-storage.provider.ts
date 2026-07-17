import { randomUUID } from 'crypto';
import { unlink } from 'fs/promises';
import { extname, join, normalize, resolve, sep } from 'path';
import { Injectable, BadRequestException } from '@nestjs/common';
import { getUploadsRoot } from 'src/common/storage/uploads-root';
import {
  IStorageProvider,
  PersistStoredFileMeta,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  public resolveAbsolutePath(storageKey: string): string {
    const root = resolve(getUploadsRoot());
    const segments = storageKey.split(/[/\\]/).filter(Boolean);

    if (
      segments.length === 0 ||
      segments.some((segment) => segment === '..' || segment.includes('\0'))
    ) {
      throw new BadRequestException('Invalid storage key');
    }

    const absolute = resolve(root, ...segments);
    const rootWithSep = normalize(root.endsWith(sep) ? root : root + sep);

    if (absolute !== root && !absolute.startsWith(rootWithSep)) {
      throw new BadRequestException('Invalid storage key');
    }

    return absolute;
  }

  public buildStorageKey(subdir: string, storedName: string): string {
    this.assertSafeSegment(subdir);
    this.assertSafeFilename(storedName);
    return `${subdir}/${storedName}`;
  }

  public buildUrlPath(subdir: string, storedName: string): string {
    return `/uploads/${this.buildStorageKey(subdir, storedName)}`;
  }

  public buildMetaFromMulterFile(
    file: Express.Multer.File,
    subdir: string,
  ): PersistStoredFileMeta {
    const storedName = file.filename;
    this.assertSafeFilename(storedName);

    const extension =
      extname(storedName).replace('.', '').toLowerCase() ||
      extname(file.originalname).replace('.', '').toLowerCase() ||
      'bin';

    return {
      extension,
      fileSize: file.size,
      mimeType: file.mimetype,
      storedName,
      originalName: file.originalname,
      storageKey: this.buildStorageKey(subdir, storedName),
      urlPath: this.buildUrlPath(subdir, storedName),
    };
  }

  public async deleteByStorageKey(storageKey: string): Promise<void> {
    try {
      await unlink(this.resolveAbsolutePath(storageKey));
    } catch {
      /* idempotent — missing file is fine */
    }
  }

  public async deleteAbsolutePath(absolutePath: string): Promise<void> {
    try {
      await unlink(absolutePath);
    } catch {
      /* idempotent */
    }
  }

  /** UUID-based filename with a sanitized extension from the client name. */
  public static buildUuidFilename(originalName: string): string {
    const rawExt = originalName.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ?? '';
    const safeExt = rawExt.toLowerCase().replace(/[^a-z0-9.]/g, '');
    return `${randomUUID()}${safeExt}`;
  }

  private assertSafeSegment(segment: string): void {
    if (!segment || segment.includes('..') || /[/\\]/.test(segment)) {
      throw new BadRequestException('Invalid storage path segment');
    }
  }

  private assertSafeFilename(filename: string): void {
    if (
      !filename ||
      filename.includes('..') ||
      filename.includes('/') ||
      filename.includes('\\') ||
      filename.includes('\0')
    ) {
      throw new BadRequestException('Invalid stored filename');
    }
  }
}

/**
 * Storage abstraction — LocalStorageProvider is the only implementation today.
 * Swap the token binding in StorageModule to introduce S3/R2 later without
 * changing upload/delete orchestration.
 */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export type PersistStoredFileMeta = {
  originalName: string;
  storedName: string;
  mimeType: string;
  extension: string;
  fileSize: number;
  storageKey: string;
  urlPath: string;
};

export interface IStorageProvider {
  /** Absolute path under the uploads root for a storage key (path-traversal safe). */
  resolveAbsolutePath(storageKey: string): string;

  buildStorageKey(subdir: string, storedName: string): string;

  buildUrlPath(subdir: string, storedName: string): string;

  /** Build DB metadata from a Multer disk file already written under `subdir`. */
  buildMetaFromMulterFile(
    file: Express.Multer.File,
    subdir: string,
  ): PersistStoredFileMeta;

  /** Remove a physical file by storage key. Idempotent. */
  deleteByStorageKey(storageKey: string): Promise<void>;

  /** Remove a Multer temp/disk file by absolute path. Idempotent. */
  deleteAbsolutePath(absolutePath: string): Promise<void>;
}

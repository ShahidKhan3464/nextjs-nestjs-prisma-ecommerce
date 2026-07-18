export enum ProductFileType {
  THUMBNAIL = 'THUMBNAIL',
  GALLERY = 'GALLERY',
  MANUAL = 'MANUAL',
}

export enum StoreFileType {
  LOGO = 'LOGO',
  BANNER = 'BANNER',
}

export enum UserFileType {
  AVATAR = 'AVATAR',
  COVER = 'COVER',
  DOCUMENT = 'DOCUMENT',
}

export enum SellerDocumentType {
  BUSINESS_LICENSE = 'BUSINESS_LICENSE',
  TAX_DOCUMENT = 'TAX_DOCUMENT',
}

/** Upload subdirectories under `uploads/`. Keep stable for public URL paths. */
export const FileUploadSubdir = {
  PRODUCTS: 'products',
  STORES: 'stores',
  USERS: 'customers',
  SELLERS: 'sellers',
} as const;

export type FileUploadSubdirValue =
  (typeof FileUploadSubdir)[keyof typeof FileUploadSubdir];

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export const DOCUMENT_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;

export const DOCUMENT_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'pdf',
] as const;

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

export const STORED_FILE_SELECT = {
  id: true,
  urlPath: true,
  mimeType: true,
  fileSize: true,
  extension: true,
  createdAt: true,
  originalName: true,
  storedName: true,
  storageKey: true,
} as const;

/** Subdirectories that must never be served via public /uploads static assets. */
export const PRIVATE_UPLOAD_SUBDIRS: ReadonlySet<string> = new Set([
  FileUploadSubdir.SELLERS,
]);

export function buildSecureFileUrlPath(fileId: number): string {
  return `/files/secure/${fileId}`;
}

export function isPrivateAssociationType(type: string): boolean {
  return (
    type === UserFileType.DOCUMENT ||
    type === SellerDocumentType.BUSINESS_LICENSE ||
    type === SellerDocumentType.TAX_DOCUMENT
  );
}

export function isPrivateStorageKey(storageKey: string): boolean {
  const subdir = storageKey.split('/')[0] ?? '';
  return PRIVATE_UPLOAD_SUBDIRS.has(subdir);
}

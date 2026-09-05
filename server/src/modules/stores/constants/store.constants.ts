export enum StoreStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum StoreFileType {
  LOGO = 'LOGO',
  BANNER = 'BANNER',
}

/** Local upload subdir (mirrors UploadSubdir; kept in-module to avoid editing common storage). */
export const STORE_UPLOAD_SUBDIR = 'stores';

export const STORE_FILE_SELECT = {
  id: true,
  urlPath: true,
  mimeType: true,
  fileSize: true,
  createdAt: true,
  originalName: true,
} as const;

export const STORE_INCLUDE = {
  files: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      file: {
        select: STORE_FILE_SELECT,
      },
    },
  },
  sellerProfile: {
    select: {
      id: true,
      userId: true,
      status: true,
      businessName: true,
    },
  },
} as const;

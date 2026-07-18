import { ProductStatus } from 'src/common/enums/product-status.enum';

export { ProductStatus } from 'src/common/enums/product-status.enum';

export enum ProductFileType {
  THUMBNAIL = 'THUMBNAIL',
  GALLERY = 'GALLERY',
  MANUAL = 'MANUAL',
}

/** Allowed status transitions. Soft-delete is separate (`deletedAt`). */
export const PRODUCT_STATUS_TRANSITIONS: Record<
  ProductStatus,
  ProductStatus[]
> = {
  [ProductStatus.DRAFT]: [ProductStatus.ACTIVE],
  [ProductStatus.ACTIVE]: [ProductStatus.ARCHIVED],
  [ProductStatus.ARCHIVED]: [ProductStatus.ACTIVE],
};

export const PRODUCT_UPLOAD_SUBDIR = 'products';

export const PRODUCT_FILE_SELECT = {
  id: true,
  urlPath: true,
  mimeType: true,
  fileSize: true,
  createdAt: true,
  originalName: true,
} as const;

export const PRODUCT_INCLUDE = {
  category: true,
  variants: true,
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  },
  files: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      file: {
        select: PRODUCT_FILE_SELECT,
      },
    },
  },
} as const;

/** Lighter include for product list endpoints. */
export const PRODUCT_LIST_INCLUDE = {
  category: {
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  },
  variants: {
    select: {
      id: true,
      sku: true,
      size: true,
      color: true,
      price: true,
      productId: true,
      stockQuantity: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  },
  files: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      file: {
        select: PRODUCT_FILE_SELECT,
      },
    },
  },
} as const;

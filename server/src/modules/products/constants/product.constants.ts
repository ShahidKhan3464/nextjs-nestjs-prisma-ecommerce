import { ProductStatus } from 'src/common/enums/product-status.enum';
import {
  StoreFileType,
  STORE_FILE_SELECT,
} from 'src/modules/stores/constants/store.constants';

export { ProductStatus } from 'src/common/enums/product-status.enum';

export enum ProductFileType {
  THUMBNAIL = 'THUMBNAIL',
  GALLERY = 'GALLERY',
  MANUAL = 'MANUAL',
}

/** Nested store summary used on product list/detail payloads. */
const PRODUCT_STORE_SELECT = {
  id: true,
  name: true,
  slug: true,
  status: true,
  verifiedAt: true,
  sellerProfile: {
    select: {
      id: true,
      businessName: true,
      status: true,
    },
  },
  files: {
    where: { type: StoreFileType.LOGO },
    take: 1,
    orderBy: { sortOrder: 'asc' as const },
    include: {
      file: {
        select: STORE_FILE_SELECT,
      },
    },
  },
} as const;

/** Allowed status transitions. Soft-delete is separate (`deletedAt`). */
export const PRODUCT_STATUS_TRANSITIONS: Record<
  ProductStatus,
  ProductStatus[]
> = {
  [ProductStatus.DRAFT]: [ProductStatus.ACTIVE],
  [ProductStatus.ACTIVE]: [],
  [ProductStatus.ARCHIVED]: [],
};

export const PRODUCT_UPLOAD_SUBDIR = 'products';

const PRODUCT_FILE_SELECT = {
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
    select: PRODUCT_STORE_SELECT,
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
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      description: true,
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
      createdAt: true,
      updatedAt: true,
      stockQuantity: true,
    },
  },
  store: {
    select: PRODUCT_STORE_SELECT,
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

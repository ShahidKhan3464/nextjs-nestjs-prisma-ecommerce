import { StoredFile } from 'src/generated/prisma/client';
import { ProductStatus } from '../constants/product.constants';
import { ProductWithRelations } from 'src/common/types/domain.types';

type ProductFileRow = {
  sortOrder: number;
  file: Pick<
    StoredFile,
    'id' | 'urlPath' | 'mimeType' | 'fileSize' | 'createdAt' | 'originalName'
  >;
};

type StoreFileRow = {
  type: string;
  sortOrder: number;
  file: Pick<StoredFile, 'id' | 'urlPath'>;
};

type StoreRow = {
  id: number;
  name: string;
  slug: string;
  status: string;
  files?: StoreFileRow[];
  deletedAt?: Date | null;
  verifiedAt?: Date | null;
  sellerProfile?: {
    id: number;
    businessName: string;
    status: string;
  } | null;
};

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  status: string;
  storeId: number;
  createdAt: Date;
  updatedAt: Date;
  categoryId: number;
  category?: unknown;
  deletedAt: Date | null;
  store?: StoreRow | null;
  publishedAt: Date | null;
  description: string | null;
  basePrice: { toNumber?: () => number } | number | string;
  variants?: Array<{
    id: number;
    sku: string;
    size: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
    productId: number;
    stockQuantity: number;
    price: { toNumber?: () => number } | number | string;
  }>;
  files?: ProductFileRow[];
};

function mapStoreSummary(
  store: StoreRow | null | undefined,
): ProductWithRelations['store'] | undefined {
  if (!store) return undefined;

  const logoPath = store.files?.[0]?.file?.urlPath ?? null;

  return {
    id: store.id,
    name: store.name,
    slug: store.slug,
    logoUrl: logoPath,
    status: store.status,
    verifiedAt: store.verifiedAt ?? null,
    ...(store.deletedAt !== undefined ? { deletedAt: store.deletedAt } : {}),
    ...(store.sellerProfile
      ? {
          sellerProfile: {
            id: store.sellerProfile.id,
            businessName: store.sellerProfile.businessName,
            status: store.sellerProfile.status,
          },
        }
      : {}),
  };
}

export function mapProductToResponse(product: ProductRow): ProductWithRelations {
  const images =
    product.files?.map((entry) => entry.file as StoredFile) ?? undefined;

  return {
    images,
    id: product.id,
    name: product.name,
    slug: product.slug,
    storeId: product.storeId,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    deletedAt: product.deletedAt,
    categoryId: product.categoryId,
    publishedAt: product.publishedAt,
    description: product.description,
    basePrice: Number(product.basePrice),
    store: mapStoreSummary(product.store),
    status: product.status as ProductStatus,
    category: product.category as ProductWithRelations['category'],
    variants: product.variants?.map((variant) => ({
      ...variant,
      price: Number(variant.price),
    })),
  };
}

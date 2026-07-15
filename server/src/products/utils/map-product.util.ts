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

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  status: string;
  storeId: number;
  store?: unknown;
  createdAt: Date;
  updatedAt: Date;
  categoryId: number;
  category?: unknown;
  deletedAt: Date | null;
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
    status: product.status as ProductStatus,
    store: product.store as ProductWithRelations['store'],
    category: product.category as ProductWithRelations['category'],
    variants: product.variants?.map((variant) => ({
      ...variant,
      price: Number(variant.price),
    })),
  };
}

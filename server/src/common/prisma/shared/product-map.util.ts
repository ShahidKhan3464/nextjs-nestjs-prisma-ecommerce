import { ProductStatus } from 'src/common/enums/product-status.enum';
import { ProductWithRelations } from 'src/common/types/domain.types';

export function mapPrismaProduct(product: {
  id: number;
  name: string;
  status: string;
  store?: unknown;
  createdAt: Date;
  updatedAt: Date;
  storeId?: number;
  categoryId: number;
  category?: unknown;
  slug: string | null;
  variants?: unknown[];
  deletedAt: Date | null;
  publishedAt?: Date | null;
  description: string | null;
  basePrice: { toNumber?: () => number } | number | string;
}): ProductWithRelations {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    deletedAt: product.deletedAt,
    storeId: product.storeId ?? 0,
    categoryId: product.categoryId,
    description: product.description,
    basePrice: Number(product.basePrice),
    status: product.status as ProductStatus,
    publishedAt: product.publishedAt ?? null,
    store: product.store as ProductWithRelations['store'],
    category: product.category as ProductWithRelations['category'],
    variants: product.variants as ProductWithRelations['variants'],
  };
}

export function mapPrismaVariant(variant: {
  id: number;
  sku: string;
  size: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  product?: unknown;
  productId: number;
  stockQuantity: number;
  price: { toNumber?: () => number } | number | string;
}) {
  return {
    id: variant.id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    price: Number(variant.price),
    productId: variant.productId,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
    stockQuantity: variant.stockQuantity,
    product: variant.product as ProductWithRelations | undefined,
  };
}

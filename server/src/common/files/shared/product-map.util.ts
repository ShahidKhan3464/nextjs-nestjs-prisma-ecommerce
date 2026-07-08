import { ProductStatus } from 'src/common/enums/product-status.enum';
import { ProductWithRelations } from 'src/common/types/domain.types';

export function mapPrismaProduct(product: {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  basePrice: { toNumber?: () => number } | number | string;
  status: string;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  category?: unknown;
  variants?: unknown[];
}): ProductWithRelations {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: Number(product.basePrice),
    status: product.status as ProductStatus,
    categoryId: product.categoryId,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    deletedAt: product.deletedAt,
    category: product.category as ProductWithRelations['category'],
    variants: product.variants as ProductWithRelations['variants'],
  };
}

export function mapPrismaVariant(variant: {
  id: number;
  size: string;
  color: string;
  sku: string;
  stock: number;
  price: { toNumber?: () => number } | number | string;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
  product?: unknown;
}) {
  return {
    id: variant.id,
    size: variant.size,
    color: variant.color,
    sku: variant.sku,
    stock: variant.stock,
    price: Number(variant.price),
    productId: variant.productId,
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
    product: variant.product as ProductWithRelations | undefined,
  };
}

import { ProductStatus } from 'src/common/enums/product-status.enum';
import { mapPrismaVariant } from 'src/common/files/shared/product-map.util';
import { ProductVariantWithRelations } from 'src/common/types/domain.types';

type VariantRow = {
  id: number;
  sku: string;
  size: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  productId: number;
  stockQuantity: number;
  price: { toNumber?: () => number } | number | string;
  product?: {
    id: number;
    name: string;
    slug: string | null;
    status: string;
    storeId: number;
    deletedAt: Date | null;
    basePrice: { toNumber?: () => number } | number | string;
    store?: {
      id: number;
      name: string;
      slug: string;
      status: string;
    };
  };
};

export function mapProductVariantToResponse(
  variant: VariantRow,
): ProductVariantWithRelations {
  const mapped = mapPrismaVariant(variant);

  if (!variant.product) {
    return mapped;
  }

  return {
    ...mapped,
    product: {
      categoryId: 0,
      description: null,
      publishedAt: null,
      id: variant.product.id,
      name: variant.product.name,
      slug: variant.product.slug,
      store: variant.product.store,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
      storeId: variant.product.storeId,
      deletedAt: variant.product.deletedAt,
      basePrice: Number(variant.product.basePrice),
      status: variant.product.status as ProductStatus,
    },
  };
}

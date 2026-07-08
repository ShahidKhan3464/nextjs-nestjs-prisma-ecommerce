import { PrismaService } from 'src/prisma/prisma.service';
import { CartItemWithRelations } from 'src/common/types/domain.types';
import { mapPrismaProduct, mapPrismaVariant } from './shared/product-map.util';
import {
  attachProductImages,
  loadProductImagesMap,
} from './shared/product-image-map.util';

export async function findCartItemsWithImages(
  prisma: PrismaService,
  where: { userId: number; productVariantId?: number },
  orderBy?: { createdAt: 'asc' | 'desc' },
): Promise<CartItemWithRelations[]> {
  const items = await prisma.cartItem.findMany({
    where,
    orderBy,
    include: {
      variant: {
        include: {
          product: true,
        },
      },
    },
  });

  const productIds = items.map((item) => item.variant.product.id);
  const imageMap = await loadProductImagesMap(prisma, productIds);

  return items.map((item) => ({
    id: item.id,
    userId: item.userId,
    productVariantId: item.productVariantId,
    quantity: item.quantity,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    variant: {
      ...mapPrismaVariant(item.variant),
      product: attachProductImages(
        [mapPrismaProduct(item.variant.product)],
        imageMap,
      )[0],
    },
  }));
}

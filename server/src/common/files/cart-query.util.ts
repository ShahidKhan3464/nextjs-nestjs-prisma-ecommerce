import { PrismaService } from 'src/prisma/prisma.service';
import { CartItemWithRelations } from 'src/common/types/domain.types';
import { mapPrismaProduct, mapPrismaVariant } from './shared/product-map.util';
import {
  attachProductImages,
  loadProductImagesMap,
} from './shared/product-image-map.util';

const CART_ITEM_SELECT = {
  id: true,
  userId: true,
  quantity: true,
  createdAt: true,
  updatedAt: true,
  productVariantId: true,
  variant: {
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
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          storeId: true,
          categoryId: true,
          deletedAt: true,
          description: true,
          basePrice: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              deletedAt: true,
              sellerProfile: {
                select: {
                  id: true,
                  userId: true,
                  status: true,
                  deletedAt: true,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export async function findCartItemsWithImages(
  prisma: PrismaService,
  where: { userId: number; productVariantId?: number },
  orderBy?: { createdAt: 'asc' | 'desc' },
): Promise<CartItemWithRelations[]> {
  const items = await prisma.cartItem.findMany({
    where,
    orderBy,
    select: CART_ITEM_SELECT,
  });

  const productIds = items.map((item) => item.variant.product.id);
  const imageMap = await loadProductImagesMap(prisma, productIds);

  return items.map((item) => {
    const product = mapPrismaProduct(item.variant.product);
    const withImages = attachProductImages([product], imageMap)[0];

    return {
      id: item.id,
      userId: item.userId,
      quantity: item.quantity,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      productVariantId: item.productVariantId,
      variant: {
        ...mapPrismaVariant(item.variant),
        product: {
          ...withImages,
          store: item.variant.product.store
            ? {
                id: item.variant.product.store.id,
                name: item.variant.product.store.name,
                slug: item.variant.product.store.slug,
                status: item.variant.product.store.status,
                deletedAt: item.variant.product.store.deletedAt,
                sellerProfile: item.variant.product.store.sellerProfile
                  ? {
                      id: item.variant.product.store.sellerProfile.id,
                      userId: item.variant.product.store.sellerProfile.userId,
                      status: item.variant.product.store.sellerProfile.status,
                      deletedAt:
                        item.variant.product.store.sellerProfile.deletedAt,
                    }
                  : undefined,
              }
            : undefined,
        },
      },
    };
  });
}

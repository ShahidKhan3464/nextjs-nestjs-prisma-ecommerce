import { PrismaService } from 'src/prisma/prisma.service';
import { mapPrismaProduct } from './shared/product-map.util';
import { ProductWithRelations } from 'src/common/types/domain.types';
import {
  attachProductImages,
  loadProductImagesMap,
} from './shared/product-image-map.util';

export async function attachImagesToNestedProducts(
  prisma: PrismaService,
  products: ProductWithRelations[],
): Promise<ProductWithRelations[]> {
  const imageMap = await loadProductImagesMap(
    prisma,
    products.map((p) => p.id),
  );
  return attachProductImages(products, imageMap);
}

export async function findProductWithImages(
  prisma: PrismaService,
  args: Parameters<PrismaService['product']['findFirst']>[0],
): Promise<ProductWithRelations | null> {
  const product = await prisma.product.findFirst({
    ...args,
    include: {
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
      ...(typeof args?.include === 'object' && args.include !== null
        ? args.include
        : {}),
    },
  });
  if (!product) {
    return null;
  }
  const mapped = mapPrismaProduct({
    ...product,
    variants: product.variants?.map((variant) => ({
      ...variant,
      price: Number(variant.price),
    })),
  });
  const [withImages] = await attachImagesToNestedProducts(prisma, [mapped]);
  return withImages;
}

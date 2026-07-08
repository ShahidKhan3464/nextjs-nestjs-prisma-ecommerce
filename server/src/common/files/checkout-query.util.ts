import { PrismaService } from 'src/prisma/prisma.service';
import { CheckoutSessionWithRelations } from 'src/common/types/domain.types';
import { mapPrismaProduct, mapPrismaVariant } from './shared/product-map.util';
import {
  attachProductImages,
  loadProductImagesMap,
} from './shared/product-image-map.util';

export async function findCheckoutSessionWithImages(
  prisma: PrismaService,
  where: { id: number; userId: number },
): Promise<CheckoutSessionWithRelations | null> {
  const session = await prisma.checkoutSession.findFirst({
    where,
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  const productIds = session.items.map((item) => item.variant.product.id);
  const imageMap = await loadProductImagesMap(prisma, productIds);

  return {
    id: session.id,
    userId: session.userId,
    totalAmount: Number(session.totalAmount),
    subtotal: Number(session.subtotal),
    tax: Number(session.tax),
    shippingAddress: session.shippingAddress,
    stripePaymentIntentId: session.stripePaymentIntentId,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    items: session.items.map((item) => ({
      id: item.id,
      checkoutSessionId: item.checkoutSessionId,
      variantId: item.variantId,
      quantity: item.quantity,
      priceAtPurchase: Number(item.priceAtPurchase),
      variant: {
        ...mapPrismaVariant(item.variant),
        product: attachProductImages(
          [mapPrismaProduct(item.variant.product)],
          imageMap,
        )[0],
      },
    })),
  };
}

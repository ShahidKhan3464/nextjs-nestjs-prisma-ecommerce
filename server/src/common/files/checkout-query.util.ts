import { PrismaService } from 'src/prisma/prisma.service';
import { CheckoutSessionWithRelations } from 'src/common/types/domain.types';
import { mapPrismaProduct, mapPrismaVariant } from './shared/product-map.util';
import { CheckoutSessionStatus } from 'src/common/enums/checkout-session-status.enum';
import {
  attachProductImages,
  loadProductImagesMap,
} from './shared/product-image-map.util';

export async function findCheckoutSessionWithImages(
  prisma: PrismaService,
  where: {
    id: number;
    userId: number;
    status?: CheckoutSessionStatus;
  },
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
    tax: Number(session.tax),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    subtotal: Number(session.subtotal),
    totalAmount: Number(session.totalAmount),
    shippingAddress: session.shippingAddress,
    status: session.status as CheckoutSessionStatus,
    stripePaymentIntentId: session.stripePaymentIntentId,
    items: session.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      variantId: item.variantId,
      checkoutSessionId: item.checkoutSessionId,
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

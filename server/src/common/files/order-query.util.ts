import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { OrderWithRelations } from 'src/common/types/domain.types';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { mapPrismaProduct, mapPrismaVariant } from './shared/product-map.util';
import {
  attachProductImages,
  loadProductImagesMap,
} from './shared/product-image-map.util';

export async function findOrdersWithImages(
  prisma: PrismaService,
  args: Parameters<PrismaService['order']['findMany']>[0],
): Promise<OrderWithRelations[]> {
  const orders = await prisma.order.findMany({
    ...args,
    include: {
      user: true,
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

  const productIds = orders.flatMap((order) =>
    order.items.map((item) => item.variant.product.id),
  );
  const imageMap = await loadProductImagesMap(prisma, productIds);

  return orders.map((order) => ({
    id: order.id,
    userId: order.userId,
    orderNumber: order.orderNumber,
    status: order.status as OrderStatus,
    paymentStatus: order.paymentStatus as PaymentStatus,
    totalAmount: Number(order.totalAmount),
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    shippingAddress: order.shippingAddress,
    stripePaymentIntentId: order.stripePaymentIntentId,
    paymentMethodSummary: order.paymentMethodSummary,
    cancellationReason: order.cancellationReason,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    user: order.user ?? undefined,
    items: order.items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      variantId: item.variantId,
      quantity: item.quantity,
      priceAtPurchase: Number(item.priceAtPurchase),
      imageUrl: item.imageUrl,
      variant: {
        ...mapPrismaVariant(item.variant),
        product: attachProductImages(
          [mapPrismaProduct(item.variant.product)],
          imageMap,
        )[0],
      },
    })),
  }));
}

export async function findOrderWithImages(
  prisma: PrismaService,
  where: { id: number },
): Promise<OrderWithRelations | null> {
  const orders = await findOrdersWithImages(prisma, { where, take: 1 });
  return orders[0] ?? null;
}

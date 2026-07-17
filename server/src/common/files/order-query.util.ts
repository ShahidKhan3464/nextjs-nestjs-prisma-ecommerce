import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { OrderWithRelations } from 'src/common/types/domain.types';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { PaymentProvider } from 'src/common/enums/payment-provider.enum';
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
      payment: true,
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
    storeId: order.storeId,
    tax: Number(order.tax),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    shippedAt: order.shippedAt,
    user: order.user ?? undefined,
    cancelledAt: order.cancelledAt,
    deliveredAt: order.deliveredAt,
    orderNumber: order.orderNumber,
    subtotal: Number(order.subtotal),
    status: order.status as OrderStatus,
    totalAmount: Number(order.totalAmount),
    shippingAddress: order.shippingAddress,
    cancellationReason: order.cancellationReason,
    payment: order.payment
      ? {
          id: order.payment.id,
          paidAt: order.payment.paidAt,
          orderId: order.payment.orderId,
          currency: order.payment.currency,
          createdAt: order.payment.createdAt,
          updatedAt: order.payment.updatedAt,
          amount: Number(order.payment.amount),
          transactionId: order.payment.transactionId,
          failureReason: order.payment.failureReason,
          methodSummary: order.payment.methodSummary,
          status: order.payment.status as PaymentStatus,
          provider: order.payment.provider as PaymentProvider,
          refundedAmount: Number(order.payment.refundedAmount),
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      quantity: item.quantity,
      variantId: item.variantId,
      variantSku: item.variantSku,
      productName: item.productName,
      variantSize: item.variantSize,
      variantColor: item.variantColor,
      productImageUrl: item.productImageUrl,
      priceAtPurchase: Number(item.priceAtPurchase),
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

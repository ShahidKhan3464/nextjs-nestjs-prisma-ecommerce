import { FileOwnerModule } from './file.constants';
import { StoredFile } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ProductStatus } from 'src/products/constants/product.constants';
import {
  OrderWithRelations,
  ProductWithRelations,
  CartItemWithRelations,
  CheckoutSessionWithRelations,
} from 'src/common/types/domain.types';
import {
  OrderStatus,
  PaymentStatus,
} from 'src/orders/constants/order.constants';

async function loadProductImagesMap(
  prisma: PrismaService,
  productIds: number[],
): Promise<Map<number, StoredFile[]>> {
  if (productIds.length === 0) {
    return new Map();
  }

  const files = await prisma.storedFile.findMany({
    where: {
      ownerModule: FileOwnerModule.PRODUCT,
      ownerId: { in: productIds },
    },
    orderBy: { sortOrder: 'asc' },
  });

  const map = new Map<number, StoredFile[]>();
  for (const file of files) {
    const list = map.get(file.ownerId) ?? [];
    list.push(file);
    map.set(file.ownerId, list);
  }
  return map;
}

function attachProductImages<T extends { id: number; images?: StoredFile[] }>(
  items: T[],
  imageMap: Map<number, StoredFile[]>,
): T[] {
  return items.map((item) => ({
    ...item,
    images: imageMap.get(item.id) ?? [],
  }));
}

function mapPrismaProduct(product: {
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

function mapPrismaVariant(variant: {
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
    user: order.user
      ? {
          ...order.user,
          role: order.user.role as UserRole,
        }
      : undefined,
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

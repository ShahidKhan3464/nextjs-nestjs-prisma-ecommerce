import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';

type ReviewStatsClient = PrismaService | Prisma.TransactionClient;

type RatingDistribution = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

export type ReviewStats = {
  averageRating: number;
  totalReviews: number;
  distribution: RatingDistribution;
};

export type ProductReviewStats = {
  productId: number;
  averageRating: number;
  totalReviews: number;
};

export type StoreReviewStats = {
  averageRating: number;
  totalReviews: number;
  productsSold: number;
};

const EMPTY_DISTRIBUTION: RatingDistribution = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
};

export function calculateAverageRating(sum: number, count: number): number {
  if (count <= 0) {
    return 0;
  }
  return Math.round((sum * 10) / count) / 10;
}

export async function syncProductReviewStats(
  tx: ReviewStatsClient,
  productId: number,
): Promise<{ averageRating: number; reviewCount: number }> {
  const aggregate = await tx.review.aggregate({
    where: { productId },
    _sum: { rating: true },
    _count: { _all: true },
  });

  const reviewCount = aggregate._count._all;
  const averageRating = calculateAverageRating(
    aggregate._sum.rating ?? 0,
    reviewCount,
  );

  await tx.product.update({
    where: { id: productId },
    data: { averageRating, reviewCount },
  });

  return { averageRating, reviewCount };
}

export async function getProductReviewStats(
  prisma: PrismaService,
  productId: number,
): Promise<ReviewStats> {
  const [aggregate, groups] = await Promise.all([
    prisma.review.aggregate({
      where: { productId },
      _sum: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { _all: true },
    }),
  ]);

  const distribution: RatingDistribution = { ...EMPTY_DISTRIBUTION };
  for (const row of groups) {
    const key = row.rating as 1 | 2 | 3 | 4 | 5;
    if (key >= 1 && key <= 5) {
      distribution[key] = row._count._all;
    }
  }

  const totalReviews = aggregate._count._all;
  return {
    totalReviews,
    averageRating: calculateAverageRating(
      aggregate._sum.rating ?? 0,
      totalReviews,
    ),
    distribution,
  };
}

export async function getReviewStatsForProducts(
  prisma: PrismaService,
  productIds: number[],
): Promise<Map<number, ProductReviewStats>> {
  const map = new Map<number, ProductReviewStats>();
  if (productIds.length === 0) return map;

  const rows = await prisma.review.groupBy({
    by: ['productId'],
    where: { productId: { in: productIds } },
    _sum: { rating: true },
    _count: { _all: true },
  });

  for (const id of productIds) {
    map.set(id, { productId: id, averageRating: 0, totalReviews: 0 });
  }

  for (const row of rows) {
    map.set(row.productId, {
      productId: row.productId,
      totalReviews: row._count._all,
      averageRating: calculateAverageRating(
        row._sum.rating ?? 0,
        row._count._all,
      ),
    });
  }

  return map;
}

export async function getStoreReviewStats(
  prisma: PrismaService,
  storeId: number,
): Promise<StoreReviewStats> {
  const [aggregate, productsSold] = await Promise.all([
    prisma.review.aggregate({
      where: { product: { storeId } },
      _sum: { rating: true },
      _count: { _all: true },
    }),
    prisma.orderItem.count({
      where: {
        order: {
          storeId,
          status: { not: OrderStatus.CANCELLED },
          payment: { status: PaymentStatus.SUCCEEDED },
        },
      },
    }),
  ]);

  const totalReviews = aggregate._count._all;
  return {
    totalReviews,
    productsSold,
    averageRating: calculateAverageRating(
      aggregate._sum.rating ?? 0,
      totalReviews,
    ),
  };
}

export async function findProductIdsByMinRating(
  prisma: PrismaService,
  minRating: number,
  storeId?: number,
): Promise<number[]> {
  const rows = await prisma.review.groupBy({
    by: ['productId'],
    where: storeId !== undefined ? { product: { storeId } } : undefined,
    _avg: { rating: true },
    having: {
      rating: {
        _avg: { gte: minRating },
      },
    },
  });

  return rows.map((row) => row.productId);
}

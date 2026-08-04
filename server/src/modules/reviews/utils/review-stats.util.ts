import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';

export type RatingDistribution = {
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

export function emptyReviewStats(): ReviewStats {
  return {
    averageRating: 0,
    totalReviews: 0,
    distribution: { ...EMPTY_DISTRIBUTION },
  };
}

function roundRating(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function getProductReviewStats(
  prisma: PrismaService,
  productId: number,
): Promise<ReviewStats> {
  const [aggregate, groups] = await Promise.all([
    prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
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
    averageRating:
      totalReviews > 0 ? roundRating(Number(aggregate._avg.rating ?? 0)) : 0,
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
    _avg: { rating: true },
    _count: { _all: true },
  });

  for (const id of productIds) {
    map.set(id, { productId: id, averageRating: 0, totalReviews: 0 });
  }

  for (const row of rows) {
    map.set(row.productId, {
      productId: row.productId,
      totalReviews: row._count._all,
      averageRating: roundRating(Number(row._avg.rating ?? 0)),
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
      _avg: { rating: true },
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
    averageRating:
      totalReviews > 0 ? roundRating(Number(aggregate._avg.rating ?? 0)) : 0,
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

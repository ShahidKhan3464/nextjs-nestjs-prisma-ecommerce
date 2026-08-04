import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { findOrdersWithImages } from 'src/common/prisma/file-query.util';
import { ProductStatus } from 'src/modules/products/constants/product.constants';
import {
  OrderStatus,
  PaymentStatus,
} from 'src/modules/orders/constants/order.constants';
import {
  OrderResponse,
  mapOrderToResponse,
} from 'src/modules/orders/utils/map-order.util';
import {
  getStoreReviewStats,
  getReviewStatsForProducts,
} from 'src/modules/reviews/utils/review-stats.util';
import {
  SellerStoreSummary,
  DashboardReviewItem,
  DashboardTopProduct,
  DashboardStatusCount,
  DashboardLowStockItem,
  DashboardRevenuePoint,
  DashboardActivityItem,
  SellerDashboardResponse,
} from '../utils/dashboard.types';

const REVENUE_DAYS = 7;
const LOW_STOCK_THRESHOLD = 5;
const RECENT_ORDERS_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 8;
const RECENT_REVIEWS_LIMIT = 5;
const TOP_PRODUCTS_LIMIT = 5;

type SellerStoreBase = Omit<
  SellerStoreSummary,
  'averageRating' | 'totalReviews' | 'productsSold'
>;

@Injectable()
export class GetSellerDashboardProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: number): Promise<SellerDashboardResponse> {
    const storeBase = await this.resolveStore(userId);
    const storeId = storeBase.id;

    const [
      revenueRow,
      ordersCount,
      productsCount,
      variantsCount,
      pendingOrders,
      lowStockCount,
      revenueByDay,
      ordersByStatus,
      lowStock,
      recentOrders,
      recentActivity,
      reviewStats,
      recentReviews,
      topProducts,
    ] = await Promise.all([
      this.getTotalRevenue(storeId),
      this.prisma.order.count({ where: { storeId } }),
      this.prisma.product.count({
        where: { storeId, status: ProductStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.productVariant.count({
        where: { product: { storeId, deletedAt: null } },
      }),
      this.prisma.order.count({
        where: { storeId, status: OrderStatus.PENDING },
      }),
      this.prisma.productVariant.count({
        where: {
          stockQuantity: { lt: LOW_STOCK_THRESHOLD },
          product: {
            storeId,
            deletedAt: null,
            status: ProductStatus.ACTIVE,
          },
        },
      }),
      this.getRevenueByDay(storeId),
      this.getOrdersByStatus(storeId),
      this.getLowStock(storeId),
      this.getRecentOrders(storeId),
      this.getRecentActivity(userId),
      getStoreReviewStats(this.prisma, storeId),
      this.getRecentReviews(storeId),
      this.getTopProducts(storeId),
    ]);

    const store: SellerStoreSummary = {
      ...storeBase,
      averageRating: reviewStats.averageRating,
      totalReviews: reviewStats.totalReviews,
      productsSold: reviewStats.productsSold,
    };

    return {
      store,
      totals: {
        orders: ordersCount,
        products: productsCount,
        variants: variantsCount,
        pendingOrders,
        lowStockCount,
        averageRating: reviewStats.averageRating,
        totalReviews: reviewStats.totalReviews,
        revenue: Math.round(Number(revenueRow?.revenue ?? 0) * 100) / 100,
      },
      revenueByDay,
      ordersByStatus,
      lowStock,
      recentOrders,
      recentActivity,
      recentReviews,
      topProducts,
    };
  }

  private async resolveStore(userId: number): Promise<SellerStoreBase> {
    const store = await this.prisma.store.findFirst({
      where: {
        deletedAt: null,
        sellerProfile: { userId, deletedAt: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        status: true,
        country: true,
        address: true,
        description: true,
        verifiedAt: true,
        sellerProfile: { select: { businessName: true } },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found for this seller');
    }

    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      city: store.city,
      status: store.status,
      country: store.country,
      address: store.address,
      description: store.description,
      verifiedAt: store.verifiedAt,
      businessName: store.sellerProfile.businessName,
    };
  }

  private async getTotalRevenue(
    storeId: number,
  ): Promise<{ revenue: string } | undefined> {
    const result = await this.prisma.order.aggregate({
      where: {
        storeId,
        payment: { status: PaymentStatus.SUCCEEDED },
        status: { not: OrderStatus.CANCELLED },
      },
      _sum: { totalAmount: true },
    });
    return { revenue: String(result._sum?.totalAmount ?? 0) };
  }

  private async getRevenueByDay(
    storeId: number,
  ): Promise<DashboardRevenuePoint[]> {
    const { start, keys } = this.buildLastNDaysRange(REVENUE_DAYS);

    const rows = await this.prisma.$queryRaw<
      { date: string; revenue: string }[]
    >`
      SELECT TO_CHAR(o."createdAt", 'YYYY-MM-DD') AS date,
             COALESCE(SUM(o."totalAmount"), 0) AS revenue
      FROM orders o
      INNER JOIN payments p ON p."orderId" = o.id
      WHERE o."storeId" = ${storeId}
        AND o."createdAt" >= ${start}
        AND p.status = ${PaymentStatus.SUCCEEDED}::payment_status_enum
        AND o.status != ${OrderStatus.CANCELLED}::orders_status_enum
      GROUP BY TO_CHAR(o."createdAt", 'YYYY-MM-DD')
    `;

    const byDate = new Map(rows.map((row) => [row.date, Number(row.revenue)]));

    return keys.map((date) => ({
      date,
      revenue: Math.round((byDate.get(date) ?? 0) * 100) / 100,
    }));
  }

  private async getOrdersByStatus(
    storeId: number,
  ): Promise<DashboardStatusCount[]> {
    const rows = await this.prisma.order.groupBy({
      by: ['status'],
      where: { storeId },
      _count: { _all: true },
    });

    return rows.map((row) => ({
      status: row.status,
      count: row._count._all,
    }));
  }

  private async getLowStock(storeId: number): Promise<DashboardLowStockItem[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: {
        stockQuantity: { lt: LOW_STOCK_THRESHOLD },
        product: {
          storeId,
          deletedAt: null,
          status: ProductStatus.ACTIVE,
        },
      },
      include: { product: true },
      orderBy: { stockQuantity: 'asc' },
      take: 10,
    });

    return variants.map((variant) => ({
      sku: variant.sku,
      stock: variant.stockQuantity,
      product: variant.product.name,
    }));
  }

  private async getRecentOrders(storeId: number): Promise<OrderResponse[]> {
    const orders = await findOrdersWithImages(this.prisma, {
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ORDERS_LIMIT,
    });

    return orders.map((order) =>
      mapOrderToResponse(order, { includeBuyer: true }),
    );
  }

  private async getRecentActivity(
    userId: number,
  ): Promise<DashboardActivityItem[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ACTIVITY_LIMIT,
    });

    return notifications.map((notification) => ({
      id: String(notification.id),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.readAt !== null,
      createdAt: notification.createdAt.toISOString(),
    }));
  }

  private async getRecentReviews(
    storeId: number,
  ): Promise<DashboardReviewItem[]> {
    const reviews = await this.prisma.review.findMany({
      where: { product: { storeId } },
      orderBy: { createdAt: 'desc' },
      take: RECENT_REVIEWS_LIMIT,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
        product: { select: { name: true, slug: true } },
        user: { select: { fullName: true } },
      },
    });

    return reviews.map((review) => ({
      id: String(review.id),
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      productName: review.product.name,
      productSlug: review.product.slug,
      buyerName: review.user.fullName,
      createdAt: review.createdAt.toISOString(),
    }));
  }

  private async getTopProducts(
    storeId: number,
  ): Promise<DashboardTopProduct[]> {
    const rows = await this.prisma.$queryRaw<
      { productId: number; unitsSold: string; revenue: string }[]
    >`
      SELECT pv."productId" AS "productId",
             COALESCE(SUM(oi.quantity), 0) AS "unitsSold",
             COALESCE(SUM(oi.quantity * oi."priceAtPurchase"), 0) AS revenue
      FROM order_items oi
      INNER JOIN orders o ON o.id = oi."orderId"
      INNER JOIN payments p ON p."orderId" = o.id
      INNER JOIN product_variants pv ON pv.id = oi."variantId"
      WHERE o."storeId" = ${storeId}
        AND p.status = ${PaymentStatus.SUCCEEDED}::payment_status_enum
        AND o.status != ${OrderStatus.CANCELLED}::orders_status_enum
      GROUP BY pv."productId"
      ORDER BY SUM(oi.quantity) DESC
      LIMIT ${TOP_PRODUCTS_LIMIT}
    `;

    if (rows.length === 0) return [];

    const productIds = rows.map((row) => Number(row.productId));
    const [products, reviewStats] = await Promise.all([
      this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, slug: true },
      }),
      getReviewStatsForProducts(this.prisma, productIds),
    ]);

    const productById = new Map(
      products.map((product) => [product.id, product]),
    );

    return rows.flatMap((row) => {
      const productId = Number(row.productId);
      const product = productById.get(productId);
      if (!product) return [];

      const stats = reviewStats.get(productId);

      return [
        {
          productId: String(product.id),
          name: product.name,
          slug: product.slug,
          unitsSold: Number(row.unitsSold),
          revenue: Math.round(Number(row.revenue) * 100) / 100,
          averageRating: stats?.averageRating ?? 0,
          reviewCount: stats?.totalReviews ?? 0,
        },
      ];
    });
  }

  private buildLastNDaysRange(days: number): { start: Date; keys: string[] } {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const keys: string[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      keys.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }

    return { start, keys };
  }
}

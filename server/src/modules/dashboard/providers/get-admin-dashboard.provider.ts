import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { findOrdersWithImages } from 'src/common/prisma/file-query.util';
import type { OrderResponse } from 'src/modules/orders/types/order.types';
import { NotificationType } from 'src/common/enums/notification-type.enum';
import { mapOrderToResponse } from 'src/modules/orders/utils/map-order.util';
import { ProductStatus } from 'src/modules/products/constants/product.constants';
import { SellerProfileStatus } from 'src/modules/sellers/constants/seller.constants';
import { getReviewStatsForProducts } from 'src/modules/reviews/utils/review-stats.util';
import {
  OrderStatus,
  PaymentStatus,
} from 'src/modules/orders/constants/order.constants';
import {
  DashboardReviewItem,
  DashboardTopProduct,
  DashboardStatusCount,
  DashboardLowStockItem,
  DashboardRevenuePoint,
  DashboardActivityItem,
  AdminDashboardResponse,
  DashboardRecentCustomer,
  DashboardPendingApproval,
} from '../utils/dashboard.types';
import {
  LOW_STOCK_THRESHOLD,
  DASHBOARD_REVENUE_DAYS,
  DASHBOARD_RECENT_ORDERS_LIMIT,
  DASHBOARD_RECENT_NOTIFICATIONS_LIMIT,
  DASHBOARD_RECENT_REVIEWS_LIMIT,
  DASHBOARD_TOP_PRODUCTS_LIMIT,
  DASHBOARD_RECENT_CUSTOMERS_LIMIT,
  DASHBOARD_PENDING_APPROVALS_LIMIT,
} from '../constants/dashboard.constants';

const REVENUE_DAYS = DASHBOARD_REVENUE_DAYS;
const TOP_PRODUCTS_LIMIT = DASHBOARD_TOP_PRODUCTS_LIMIT;
const RECENT_ORDERS_LIMIT = DASHBOARD_RECENT_ORDERS_LIMIT;
const RECENT_REVIEWS_LIMIT = DASHBOARD_RECENT_REVIEWS_LIMIT;
const RECENT_CUSTOMERS_LIMIT = DASHBOARD_RECENT_CUSTOMERS_LIMIT;
const PENDING_APPROVALS_LIMIT = DASHBOARD_PENDING_APPROVALS_LIMIT;
const RECENT_NOTIFICATIONS_LIMIT = DASHBOARD_RECENT_NOTIFICATIONS_LIMIT;

const ADMIN_ACTIVITY_NOTIFICATION_TYPES: NotificationType[] = [
  NotificationType.SELLER_APPROVED,
  NotificationType.SELLER_REJECTED,
  NotificationType.PRODUCT_APPROVED,
  NotificationType.PRODUCT_REJECTED,
  NotificationType.SYSTEM,
];

@Injectable()
export class GetAdminDashboardProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<AdminDashboardResponse> {
    const [
      revenueRow,
      ordersCount,
      productsCount,
      variantsCount,
      customersCount,
      pendingOrders,
      pendingSellerApprovals,
      revenueByDay,
      ordersByStatus,
      lowStock,
      recentOrders,
      recentNotifications,
      recentReviews,
      pendingApprovals,
      topProducts,
      recentCustomers,
    ] = await Promise.all([
      this.getTotalRevenue(),
      this.prisma.order.count(),
      this.prisma.product.count({
        where: { status: ProductStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.productVariant.count({
        where: { product: { deletedAt: null } },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          userRoles: { some: { role: UserRole.BUYER } },
          isBlocked: false,
        },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.sellerProfile.count({
        where: {
          status: SellerProfileStatus.PENDING,
          deletedAt: null,
        },
      }),
      this.getRevenueByDay(),
      this.getOrdersByStatus(),
      this.getLowStock(),
      this.getRecentOrders(),
      this.getRecentNotifications(),
      this.getRecentReviews(),
      this.getPendingApprovals(),
      this.getTopProducts(),
      this.getRecentCustomers(),
    ]);

    return {
      totals: {
        orders: ordersCount,
        products: productsCount,
        variants: variantsCount,
        customers: customersCount,
        pendingOrders,
        pendingSellerApprovals,
        revenue: Math.round(Number(revenueRow?.revenue ?? 0) * 100) / 100,
      },
      revenueByDay,
      ordersByStatus,
      lowStock,
      recentOrders,
      recentNotifications,
      recentReviews,
      pendingApprovals,
      topProducts,
      recentCustomers,
    };
  }

  private async getTotalRevenue(): Promise<{ revenue: string } | undefined> {
    const result = await this.prisma.order.aggregate({
      where: {
        payment: { status: PaymentStatus.SUCCEEDED },
        status: { not: OrderStatus.CANCELLED },
      },
      _sum: { totalAmount: true },
    });
    return { revenue: String(result._sum?.totalAmount ?? 0) };
  }

  private async getRevenueByDay(): Promise<DashboardRevenuePoint[]> {
    const { start, keys } = this.buildLastNDaysRange(REVENUE_DAYS);

    const rows = await this.prisma.$queryRaw<
      { date: string; revenue: string }[]
    >`
      SELECT TO_CHAR(o."createdAt", 'YYYY-MM-DD') AS date,
             COALESCE(SUM(o."totalAmount"), 0) AS revenue
      FROM orders o
      INNER JOIN payments p ON p."orderId" = o.id
      WHERE o."createdAt" >= ${start}
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

  private async getOrdersByStatus(): Promise<DashboardStatusCount[]> {
    const rows = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return rows.map((row) => ({
      status: row.status,
      count: row._count._all,
    }));
  }

  private async getLowStock(): Promise<DashboardLowStockItem[]> {
    const variants = await this.prisma.productVariant.findMany({
      where: {
        stockQuantity: { lt: LOW_STOCK_THRESHOLD },
        product: {
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

  private async getRecentOrders(): Promise<OrderResponse[]> {
    const orders = await findOrdersWithImages(this.prisma, {
      orderBy: { createdAt: 'desc' },
      take: RECENT_ORDERS_LIMIT,
    });

    return orders.map((order) => mapOrderToResponse(order));
  }

  private async getRecentNotifications(): Promise<DashboardActivityItem[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { type: { in: ADMIN_ACTIVITY_NOTIFICATION_TYPES } },
      orderBy: { createdAt: 'desc' },
      take: RECENT_NOTIFICATIONS_LIMIT,
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

  private async getRecentReviews(): Promise<DashboardReviewItem[]> {
    const reviews = await this.prisma.review.findMany({
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

  private async getPendingApprovals(): Promise<DashboardPendingApproval[]> {
    // StoreStatus only has ACTIVE/SUSPENDED — no pending store status.
    const pendingSellers = await this.prisma.sellerProfile.findMany({
      where: {
        status: SellerProfileStatus.PENDING,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: PENDING_APPROVALS_LIMIT,
      select: {
        id: true,
        businessName: true,
        status: true,
        createdAt: true,
      },
    });

    return pendingSellers.map((profile) => ({
      id: String(profile.id),
      kind: 'seller' as const,
      name: profile.businessName,
      status: profile.status,
      createdAt: profile.createdAt.toISOString(),
    }));
  }

  private async getTopProducts(): Promise<DashboardTopProduct[]> {
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
      WHERE p.status = ${PaymentStatus.SUCCEEDED}::payment_status_enum
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

  private async getRecentCustomers(): Promise<DashboardRecentCustomer[]> {
    const rows = await this.prisma.$queryRaw<
      {
        id: number;
        fullName: string;
        email: string;
        ordersCount: number;
        lastOrderAt: Date;
      }[]
    >`
      SELECT u.id,
             u."fullName",
             u.email,
             stats."ordersCount",
             stats."lastOrderAt"
      FROM (
        SELECT o."userId",
               COUNT(*)::int AS "ordersCount",
               MAX(o."createdAt") AS "lastOrderAt"
        FROM orders o
        GROUP BY o."userId"
        ORDER BY MAX(o."createdAt") DESC
        LIMIT ${RECENT_CUSTOMERS_LIMIT}
      ) stats
      INNER JOIN users u ON u.id = stats."userId"
      WHERE u."deletedAt" IS NULL
      ORDER BY stats."lastOrderAt" DESC
    `;

    return rows.map((row) => ({
      id: String(row.id),
      fullName: row.fullName,
      email: row.email,
      ordersCount: Number(row.ordersCount),
      lastOrderAt: new Date(row.lastOrderAt).toISOString(),
    }));
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

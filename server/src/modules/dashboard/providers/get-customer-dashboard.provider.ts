import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { findOrdersWithImages } from 'src/common/prisma/file-query.util';
import {
  OrderStatus,
  PaymentStatus,
} from 'src/modules/orders/constants/order.constants';
import {
  OrderResponse,
  mapOrderToResponse,
} from 'src/modules/orders/utils/map-order.util';
import {
  DashboardStatusCount,
  DashboardActivityItem,
  DashboardSpendingPoint,
  DashboardPurchasedProduct,
  CustomerDashboardResponse,
} from '../utils/dashboard.types';

const SPENDING_MONTHS = 6;
const RECENT_ORDERS_LIMIT = 5;
const RECENT_NOTIFICATIONS_LIMIT = 8;
const RECENTLY_PURCHASED_LIMIT = 8;

@Injectable()
export class GetCustomerDashboardProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: number): Promise<CustomerDashboardResponse> {
    const [
      spendingRow,
      totalOrders,
      wishlistCount,
      cartItemCount,
      ordersByStatus,
      spendingByMonth,
      recentOrders,
      recentNotifications,
      recentlyPurchased,
    ] = await Promise.all([
      this.getTotalSpending(userId),
      this.prisma.order.count({ where: { userId } }),
      this.prisma.wishlistItem.count({ where: { userId } }),
      this.prisma.cartItem.count({ where: { userId } }),
      this.getOrdersByStatus(userId),
      this.getSpendingByMonth(userId),
      this.getRecentOrders(userId),
      this.getRecentNotifications(userId),
      this.getRecentlyPurchased(userId),
    ]);

    return {
      totalOrders,
      wishlistCount,
      cartItemCount,
      ordersByStatus,
      spendingByMonth,
      recentOrders,
      recentNotifications,
      recentlyPurchased,
      totalSpending: Math.round(Number(spendingRow?.amount ?? 0) * 100) / 100,
    };
  }

  private async getTotalSpending(
    userId: number,
  ): Promise<{ amount: string } | undefined> {
    const result = await this.prisma.order.aggregate({
      where: {
        userId,
        payment: { status: PaymentStatus.SUCCEEDED },
        status: { not: OrderStatus.CANCELLED },
      },
      _sum: { totalAmount: true },
    });
    return { amount: String(result._sum?.totalAmount ?? 0) };
  }

  private async getOrdersByStatus(
    userId: number,
  ): Promise<DashboardStatusCount[]> {
    const rows = await this.prisma.order.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    });

    return rows.map((row) => ({
      status: row.status,
      count: row._count._all,
    }));
  }

  private async getSpendingByMonth(
    userId: number,
  ): Promise<DashboardSpendingPoint[]> {
    const { start, keys } = this.buildLastNMonthsRange(SPENDING_MONTHS);

    const rows = await this.prisma.$queryRaw<
      { month: string; amount: string }[]
    >`
      SELECT TO_CHAR(o."createdAt", 'YYYY-MM') AS month,
             COALESCE(SUM(o."totalAmount"), 0) AS amount
      FROM orders o
      INNER JOIN payments p ON p."orderId" = o.id
      WHERE o."userId" = ${userId}
        AND o."createdAt" >= ${start}
        AND p.status = ${PaymentStatus.SUCCEEDED}::payment_status_enum
        AND o.status != ${OrderStatus.CANCELLED}::orders_status_enum
      GROUP BY TO_CHAR(o."createdAt", 'YYYY-MM')
    `;

    const byMonth = new Map(rows.map((row) => [row.month, Number(row.amount)]));

    return keys.map((month) => ({
      month,
      amount: Math.round((byMonth.get(month) ?? 0) * 100) / 100,
    }));
  }

  private async getRecentOrders(userId: number): Promise<OrderResponse[]> {
    const orders = await findOrdersWithImages(this.prisma, {
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: RECENT_ORDERS_LIMIT,
    });

    return orders.map((order) => mapOrderToResponse(order));
  }

  private async getRecentNotifications(
    userId: number,
  ): Promise<DashboardActivityItem[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
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

  private async getRecentlyPurchased(
    userId: number,
  ): Promise<DashboardPurchasedProduct[]> {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          userId,
          status: OrderStatus.DELIVERED,
          payment: { status: PaymentStatus.SUCCEEDED },
        },
      },
      orderBy: { order: { createdAt: 'desc' } },
      take: 40,
      select: {
        order: { select: { createdAt: true } },
        variant: {
          select: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                files: {
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                  select: { file: { select: { urlPath: true } } },
                },
              },
            },
          },
        },
      },
    });

    const seen = new Set<number>();
    const result: DashboardPurchasedProduct[] = [];

    for (const item of items) {
      const product = item.variant.product;
      if (seen.has(product.id)) continue;
      seen.add(product.id);

      result.push({
        productId: String(product.id),
        name: product.name,
        slug: product.slug,
        imageUrl: product.files[0]?.file.urlPath ?? null,
        purchasedAt: item.order.createdAt.toISOString(),
      });

      if (result.length >= RECENTLY_PURCHASED_LIMIT) break;
    }

    return result;
  }

  private buildLastNMonthsRange(months: number): {
    start: Date;
    keys: string[];
  } {
    const now = new Date();
    const keys: string[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      keys.push(month);
    }

    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    start.setHours(0, 0, 0, 0);

    return { start, keys };
  }
}

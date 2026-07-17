import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { findOrdersWithImages } from 'src/common/files/file-query.util';
import {
  OrderStatus,
  PaymentStatus,
} from 'src/orders/constants/order.constants';
import {
  OrderResponse,
  mapOrderToResponse,
} from 'src/orders/utils/map-order.util';
import {
  DashboardStatusCount,
  DashboardSpendingPoint,
  CustomerDashboardResponse,
} from '../utils/dashboard.types';

const SPENDING_MONTHS = 6;
const RECENT_ORDERS_LIMIT = 5;

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
    ] = await Promise.all([
      this.getTotalSpending(userId),
      this.prisma.order.count({ where: { userId } }),
      this.prisma.wishlistItem.count({ where: { userId } }),
      this.prisma.cartItem.count({ where: { userId } }),
      this.getOrdersByStatus(userId),
      this.getSpendingByMonth(userId),
      this.getRecentOrders(userId),
    ]);

    return {
      totalOrders,
      wishlistCount,
      cartItemCount,
      ordersByStatus,
      spendingByMonth,
      recentOrders,
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

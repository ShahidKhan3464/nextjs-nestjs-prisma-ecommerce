import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { findOrdersWithImages } from 'src/common/files/file-query.util';
import { ProductStatus } from 'src/products/constants/product.constants';
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
  DashboardLowStockItem,
  DashboardRevenuePoint,
  AdminDashboardResponse,
} from '../utils/dashboard.types';

const LOW_STOCK_THRESHOLD = 5;
const REVENUE_DAYS = 7;
const RECENT_ORDERS_LIMIT = 5;

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
      revenueByDay,
      ordersByStatus,
      lowStock,
      recentOrders,
    ] = await Promise.all([
      this.getTotalRevenue(),
      this.prisma.order.count(),
      this.prisma.product.count({
        where: { status: ProductStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.productVariant.count(),
      this.prisma.user.count({
        where: {
          userRoles: { some: { role: UserRole.BUYER } },
          isBlocked: false,
        },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.getRevenueByDay(),
      this.getOrdersByStatus(),
      this.getLowStock(),
      this.getRecentOrders(),
    ]);

    return {
      totals: {
        orders: ordersCount,
        products: productsCount,
        variants: variantsCount,
        customers: customersCount,
        pendingOrders,
        revenue: Math.round(Number(revenueRow?.revenue ?? 0) * 100) / 100,
      },
      revenueByDay,
      ordersByStatus,
      lowStock,
      recentOrders,
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

    return orders.map(mapOrderToResponse);
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

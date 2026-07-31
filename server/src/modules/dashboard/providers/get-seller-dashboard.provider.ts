import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
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
  SellerStoreSummary,
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

@Injectable()
export class GetSellerDashboardProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: number): Promise<SellerDashboardResponse> {
    const store = await this.resolveStore(userId);
    const storeId = store.id;

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
    ]);

    return {
      store,
      totals: {
        orders: ordersCount,
        products: productsCount,
        variants: variantsCount,
        pendingOrders,
        lowStockCount,
        revenue: Math.round(Number(revenueRow?.revenue ?? 0) * 100) / 100,
      },
      revenueByDay,
      ordersByStatus,
      lowStock,
      recentOrders,
      recentActivity,
    };
  }

  private async resolveStore(userId: number): Promise<SellerStoreSummary> {
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

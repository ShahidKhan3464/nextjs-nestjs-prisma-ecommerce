import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Order } from 'src/orders/entities/order.entity';
import { UserRole } from 'src/users/constants/user.constants';
import { Product } from 'src/products/entities/product.entity';
import { joinProductImages } from 'src/common/files/file-query.util';
import { ProductStatus } from 'src/products/constants/product.constants';
import { ProductVariant } from 'src/products/entities/product-variant.entity';
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
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
  ) {}

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
      this.orderRepository.count(),
      this.productRepository.count({
        where: { status: ProductStatus.ACTIVE },
      }),
      this.variantRepository.count(),
      this.userRepository.count({
        where: { role: UserRole.CUSTOMER, isBlocked: false },
      }),
      this.orderRepository.count({ where: { status: OrderStatus.PENDING } }),
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
    return this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'revenue')
      .where('order.paymentStatus = :paid', { paid: PaymentStatus.PAID })
      .andWhere('order.status != :cancelled', {
        cancelled: OrderStatus.CANCELLED,
      })
      .getRawOne();
  }

  private async getRevenueByDay(): Promise<DashboardRevenuePoint[]> {
    const { start, keys } = this.buildLastNDaysRange(REVENUE_DAYS);

    const rows = await this.orderRepository
      .createQueryBuilder('order')
      .select("TO_CHAR(order.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'revenue')
      .where('order.createdAt >= :start', { start })
      .andWhere('order.paymentStatus = :paid', { paid: PaymentStatus.PAID })
      .andWhere('order.status != :cancelled', {
        cancelled: OrderStatus.CANCELLED,
      })
      .groupBy("TO_CHAR(order.createdAt, 'YYYY-MM-DD')")
      .getRawMany<{ date: string; revenue: string }>();

    const byDate = new Map(rows.map((row) => [row.date, Number(row.revenue)]));

    return keys.map((date) => ({
      date,
      revenue: Math.round((byDate.get(date) ?? 0) * 100) / 100,
    }));
  }

  private async getOrdersByStatus(): Promise<DashboardStatusCount[]> {
    const rows = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany<{ status: string; count: string }>();

    return rows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));
  }

  private async getLowStock(): Promise<DashboardLowStockItem[]> {
    const variants = await this.variantRepository
      .createQueryBuilder('variant')
      .innerJoinAndSelect('variant.product', 'product')
      .where('variant.stock < :threshold', { threshold: LOW_STOCK_THRESHOLD })
      .andWhere('product.deletedAt IS NULL')
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .orderBy('variant.stock', 'ASC')
      .take(10)
      .getMany();

    return variants.map((variant) => ({
      sku: variant.sku,
      stock: variant.stock,
      product: variant.product.name,
    }));
  }

  private async getRecentOrders(): Promise<OrderResponse[]> {
    const orders = await joinProductImages(
      this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.variant', 'variant')
        .leftJoinAndSelect('variant.product', 'product')
        .withDeleted()
        .orderBy('order.createdAt', 'DESC')
        .take(RECENT_ORDERS_LIMIT),
      'product',
    ).getMany();

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

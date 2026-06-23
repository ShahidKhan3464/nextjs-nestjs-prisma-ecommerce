import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { CartItem } from 'src/cart/entities/cart-item.entity';
import { joinProductImages } from 'src/common/files/file-query.util';
import { WishlistItem } from 'src/wishlist/entities/wishlist-item.entity';
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
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    @InjectRepository(WishlistItem)
    private readonly wishlistRepository: Repository<WishlistItem>,
  ) {}

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
      this.orderRepository.count({ where: { userId } }),
      this.wishlistRepository.count({ where: { userId } }),
      this.cartRepository.count({ where: { userId } }),
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
    return this.orderRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.totalAmount), 0)', 'amount')
      .where('order.userId = :userId', { userId })
      .andWhere('order.paymentStatus = :paid', { paid: PaymentStatus.PAID })
      .andWhere('order.status != :cancelled', {
        cancelled: OrderStatus.CANCELLED,
      })
      .getRawOne();
  }

  private async getOrdersByStatus(
    userId: number,
  ): Promise<DashboardStatusCount[]> {
    const rows = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('order.userId = :userId', { userId })
      .groupBy('order.status')
      .getRawMany<{ status: string; count: string }>();

    return rows.map((row) => ({
      status: row.status,
      count: Number(row.count),
    }));
  }

  private async getSpendingByMonth(
    userId: number,
  ): Promise<DashboardSpendingPoint[]> {
    const { start, keys } = this.buildLastNMonthsRange(SPENDING_MONTHS);

    const rows = await this.orderRepository
      .createQueryBuilder('order')
      .select("TO_CHAR(order.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'amount')
      .where('order.userId = :userId', { userId })
      .andWhere('order.createdAt >= :start', { start })
      .andWhere('order.paymentStatus = :paid', { paid: PaymentStatus.PAID })
      .andWhere('order.status != :cancelled', {
        cancelled: OrderStatus.CANCELLED,
      })
      .groupBy("TO_CHAR(order.createdAt, 'YYYY-MM')")
      .getRawMany<{ month: string; amount: string }>();

    const byMonth = new Map(rows.map((row) => [row.month, Number(row.amount)]));

    return keys.map((month) => ({
      month,
      amount: Math.round((byMonth.get(month) ?? 0) * 100) / 100,
    }));
  }

  private async getRecentOrders(userId: number): Promise<OrderResponse[]> {
    const orders = await joinProductImages(
      this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.variant', 'variant')
        .leftJoinAndSelect('variant.product', 'product')
        .withDeleted()
        .where('order.userId = :userId', { userId })
        .orderBy('order.createdAt', 'DESC')
        .take(RECENT_ORDERS_LIMIT),
      'product',
    ).getMany();

    return orders.map(mapOrderToResponse);
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

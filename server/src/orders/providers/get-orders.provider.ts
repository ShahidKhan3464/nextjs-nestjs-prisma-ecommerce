import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { Order } from '../entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryOrderDto } from '../dto/query-order.dto';
import { joinProductImages } from 'src/common/files/file-query.util';
import { OrderResponse, mapOrderToResponse } from '../utils/map-order.util';

@Injectable()
export class GetOrdersProvider {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  private baseQuery() {
    return joinProductImages(
      this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.variant', 'variant')
        .leftJoinAndSelect('variant.product', 'product')
        .withDeleted()
        .orderBy('order.createdAt', 'DESC'),
      'product',
    );
  }

  private applyFilters(
    qb: SelectQueryBuilder<Order>,
    query: QueryOrderDto,
    userId?: number,
  ) {
    if (userId !== undefined) {
      qb.andWhere('order.userId = :userId', { userId });
    } else if (query.userId !== undefined) {
      qb.andWhere('order.userId = :filterUserId', {
        filterUserId: query.userId,
      });
    }

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query.paymentStatus) {
      qb.andWhere('order.paymentStatus = :paymentStatus', {
        paymentStatus: query.paymentStatus,
      });
    }
  }

  async findByUser(
    userId: number,
    query: QueryOrderDto = {},
  ): Promise<OrderResponse[]> {
    const qb = this.baseQuery();
    this.applyFilters(qb, query, userId);
    const orders = await qb.getMany();
    return orders.map(mapOrderToResponse);
  }

  async findAll(query: QueryOrderDto = {}): Promise<OrderResponse[]> {
    const qb = this.baseQuery();
    this.applyFilters(qb, query);
    const orders = await qb.getMany();
    return orders.map(mapOrderToResponse);
  }
}

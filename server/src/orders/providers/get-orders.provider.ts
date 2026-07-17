import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { QueryOrderDto } from '../dto/query-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { findOrdersWithImages } from 'src/common/files/file-query.util';
import { OrderResponse, mapOrderToResponse } from '../utils/map-order.util';

@Injectable()
export class GetOrdersProvider {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(
    query: QueryOrderDto,
    userId?: number,
  ): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};

    if (userId !== undefined) {
      where.userId = userId;
    } else if (query.userId !== undefined) {
      where.userId = query.userId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.paymentStatus) {
      where.payment = {
        status: query.paymentStatus,
      };
    }

    return where;
  }

  async findByUser(
    userId: number,
    query: QueryOrderDto = {},
  ): Promise<OrderResponse[]> {
    const orders = await findOrdersWithImages(this.prisma, {
      where: this.buildWhere(query, userId),
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(mapOrderToResponse);
  }

  async findAll(query: QueryOrderDto = {}): Promise<OrderResponse[]> {
    const orders = await findOrdersWithImages(this.prisma, {
      where: this.buildWhere(query),
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(mapOrderToResponse);
  }
}

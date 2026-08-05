import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { QueryOrderDto } from '../dto/query-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import type { OrderResponse } from '../types/order.types';
import { mapOrderToResponse } from '../utils/map-order.util';
import { OrderOwnershipProvider } from './order-ownership.provider';
import { findOrdersWithImages } from 'src/common/prisma/file-query.util';
import { PaginationProviders } from 'src/common/pagination/providers/pagination.providers';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';

@Injectable()
export class GetOrdersProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationProviders: PaginationProviders,
    private readonly orderOwnershipProvider: OrderOwnershipProvider,
  ) {}

  private buildWhere(
    query: QueryOrderDto,
    scope?: { userId?: number; storeId?: number },
  ): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};

    if (scope?.userId !== undefined) {
      where.userId = scope.userId;
    } else if (query.userId !== undefined) {
      where.userId = query.userId;
    }

    if (scope?.storeId !== undefined) {
      where.storeId = scope.storeId;
    } else if (query.storeId !== undefined) {
      where.storeId = query.storeId;
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

  private async paginate(
    query: QueryOrderDto,
    scope: { userId?: number; storeId?: number } | undefined,
    mapOptions: { includeBuyer?: boolean },
  ): Promise<PaginateQueryResult<OrderResponse>> {
    const { page, limit, skip } = this.paginationProviders.resolvePaging(query);
    const where = this.buildWhere(query, scope);

    const total = await this.prisma.order.count({ where });
    const orders = await findOrdersWithImages(this.prisma, {
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: orders.map((order) => mapOrderToResponse(order, mapOptions)),
      page,
      limit,
      total,
    };
  }

  /** Buyer — only their own orders. */
  async findByUser(
    userId: number,
    query: QueryOrderDto,
  ): Promise<PaginateQueryResult<OrderResponse>> {
    return this.paginate(query, { userId }, { includeBuyer: false });
  }

  /** Seller — only orders belonging to their store. */
  async findBySeller(
    userId: number,
    query: QueryOrderDto,
  ): Promise<PaginateQueryResult<OrderResponse>> {
    const store =
      await this.orderOwnershipProvider.findOwnedStoreOrThrow(userId);
    return this.paginate(query, { storeId: store.id }, { includeBuyer: true });
  }

  /** Admin — all orders with optional filters. */
  async findAll(
    query: QueryOrderDto,
  ): Promise<PaginateQueryResult<OrderResponse>> {
    return this.paginate(query, undefined, { includeBuyer: true });
  }
}

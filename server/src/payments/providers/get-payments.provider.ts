import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryPaymentDto } from '../dto/query-payment.dto';
import { findPaymentsWithOrder } from '../utils/payment-query.util';
import { PaymentOwnershipProvider } from './payment-ownership.provider';
import { PaginationProviders } from 'src/common/pagination/providers/pagination.providers';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';
import {
  PaymentResponse,
  mapPaymentToResponse,
} from '../utils/map-payment.util';

@Injectable()
export class GetPaymentsProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationProviders: PaginationProviders,
    private readonly paymentOwnershipProvider: PaymentOwnershipProvider,
  ) {}

  private buildWhere(
    query: QueryPaymentDto,
    scope?: { userId?: number; storeId?: number },
  ): Prisma.PaymentWhereInput {
    const where: Prisma.PaymentWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.provider) {
      where.provider = query.provider;
    }

    if (query.orderId !== undefined) {
      where.orderId = query.orderId;
    }

    if (query.transactionId) {
      where.transactionId = query.transactionId;
    }

    if (query.hasFailure === true) {
      where.failureReason = { not: null };
    }

    if (query.hasRefund === true) {
      where.refundedAmount = { gt: 0 };
    }

    const orderWhere: Prisma.OrderWhereInput = {};

    if (scope?.userId !== undefined) {
      orderWhere.userId = scope.userId;
    } else if (query.userId !== undefined) {
      orderWhere.userId = query.userId;
    }

    if (scope?.storeId !== undefined) {
      orderWhere.storeId = scope.storeId;
    } else if (query.storeId !== undefined) {
      orderWhere.storeId = query.storeId;
    }

    if (Object.keys(orderWhere).length > 0) {
      where.order = orderWhere;
    }

    return where;
  }

  private async paginate(
    query: QueryPaymentDto,
    scope?: { userId?: number; storeId?: number },
  ): Promise<PaginateQueryResult<PaymentResponse>> {
    const { page, limit, skip } = this.paginationProviders.resolvePaging(query);
    const where = this.buildWhere(query, scope);

    const total = await this.prisma.payment.count({ where });
    const payments = await findPaymentsWithOrder(this.prisma, {
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: payments.map((payment) => mapPaymentToResponse(payment)),
      page,
      limit,
      total,
    };
  }

  /** Buyer — payments for their own orders. */
  findByUser(
    userId: number,
    query: QueryPaymentDto,
  ): Promise<PaginateQueryResult<PaymentResponse>> {
    return this.paginate(query, { userId });
  }

  /** Seller — payments for orders belonging to their store. */
  async findBySeller(
    userId: number,
    query: QueryPaymentDto,
  ): Promise<PaginateQueryResult<PaymentResponse>> {
    const store =
      await this.paymentOwnershipProvider.findOwnedStoreOrThrow(userId);
    return this.paginate(query, { storeId: store.id });
  }

  /** Admin — all payments with optional filters. */
  findAll(
    query: QueryPaymentDto,
  ): Promise<PaginateQueryResult<PaymentResponse>> {
    return this.paginate(query);
  }
}

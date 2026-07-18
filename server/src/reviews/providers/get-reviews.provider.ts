import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { QueryReviewDto } from '../dto/query-review.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReviewOwnershipProvider } from './review-ownership.provider';
import { findReviewsWithRelations } from '../utils/review-query.util';
import { mapReviewToResponse, ReviewResponse } from '../utils/map-review.util';
import { PaginationProviders } from 'src/common/pagination/providers/pagination.providers';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';

type ReviewListScope = {
  userId?: number;
  storeId?: number;
  productId?: number;
};

@Injectable()
export class GetReviewsProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationProviders: PaginationProviders,
    private readonly reviewOwnershipProvider: ReviewOwnershipProvider,
  ) {}

  private buildWhere(
    query: QueryReviewDto,
    scope?: ReviewListScope,
  ): Prisma.ReviewWhereInput {
    const where: Prisma.ReviewWhereInput = {};

    if (query.rating !== undefined) {
      where.rating = query.rating;
    }

    const productId = scope?.productId ?? query.productId;
    if (productId !== undefined) {
      where.productId = productId;
    }

    if (scope?.userId !== undefined) {
      where.userId = scope.userId;
    } else if (query.userId !== undefined) {
      where.userId = query.userId;
    }

    const storeId = scope?.storeId ?? query.storeId;
    if (storeId !== undefined) {
      where.product = { storeId };
    }

    return where;
  }

  private async paginate(
    query: QueryReviewDto,
    scope?: ReviewListScope,
    includeProduct = true,
  ): Promise<PaginateQueryResult<ReviewResponse>> {
    const { page, limit, skip } = this.paginationProviders.resolvePaging(query);
    const where = this.buildWhere(query, scope);

    const total = await this.prisma.review.count({ where });
    const reviews = await findReviewsWithRelations(this.prisma, {
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: reviews.map((review) =>
        mapReviewToResponse(review, { includeProduct }),
      ),
      page,
      limit,
      total,
    };
  }

  /** Public/catalog — reviews for a product (includes historical soft-deleted products). */
  findByProduct(
    productId: number,
    query: QueryReviewDto,
  ): Promise<PaginateQueryResult<ReviewResponse>> {
    return this.paginate(query, { productId }, false);
  }

  /** Buyer — their own reviews. */
  findByUser(
    userId: number,
    query: QueryReviewDto,
  ): Promise<PaginateQueryResult<ReviewResponse>> {
    return this.paginate(query, { userId }, true);
  }

  /** Seller — reviews on products belonging to their store. */
  async findBySeller(
    userId: number,
    query: QueryReviewDto,
  ): Promise<PaginateQueryResult<ReviewResponse>> {
    const store =
      await this.reviewOwnershipProvider.findOwnedStoreOrThrow(userId);
    return this.paginate(query, { storeId: store.id }, true);
  }

  /** Admin — all reviews with optional filters. */
  findAll(query: QueryReviewDto): Promise<PaginateQueryResult<ReviewResponse>> {
    return this.paginate(query, undefined, true);
  }
}

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryProductDto } from '../dto/query-product.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { mapProductToResponse } from '../utils/map-product.util';
import { ProductWithRelations } from 'src/common/types/domain.types';
import { ProductOwnershipProvider } from './product-ownership.provider';
import { PaginationProviders } from 'src/common/pagination/providers/pagination.providers';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';
import {
  findProductIdsByMinRating,
  getReviewStatsForProducts,
} from 'src/modules/reviews/utils/review-stats.util';
import {
  ProductStatus,
  PRODUCT_INCLUDE,
  PRODUCT_LIST_INCLUDE,
} from '../constants/product.constants';

@Injectable()
export class GetProductsProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationProviders: PaginationProviders,
    private readonly productOwnershipProvider: ProductOwnershipProvider,
  ) {}

  private async buildWhere(
    query: QueryProductDto,
    scope?: { storeId?: number; allowLifeCycle?: boolean },
  ): Promise<Prisma.ProductWhereInput> {
    const where: Prisma.ProductWhereInput = {};
    const allowLifeCycle = scope?.allowLifeCycle === true;

    if (allowLifeCycle && query.lifeCycle === 'removed') {
      where.deletedAt = { not: null };
    } else if (allowLifeCycle && query.lifeCycle === 'all') {
      /* no deletedAt filter */
    } else {
      where.deletedAt = null;
    }

    if (scope?.storeId !== undefined) {
      where.storeId = scope.storeId;
    } else if (query.storeId) {
      where.storeId = query.storeId;
    } else if (query.excludeStoreId) {
      where.storeId = { not: query.excludeStoreId };
    }

    if (query.sellerId) {
      where.store = {
        sellerProfileId: query.sellerId,
      };
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (scope?.storeId !== undefined) {
      if (query.status) {
        where.status = query.status;
      }
    } else {
      where.status = ProductStatus.ACTIVE;
    }

    if (query.search?.trim()) {
      where.OR = [
        { name: { contains: query.search.trim(), mode: 'insensitive' } },
        {
          description: {
            contains: query.search.trim(),
            mode: 'insensitive',
          },
        },
      ];
    }

    const variantFilters: Prisma.ProductVariantWhereInput[] = [];

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      variantFilters.push({
        ...(query.minPrice !== undefined && query.minPrice !== null
          ? { price: { gte: query.minPrice } }
          : {}),
        ...(query.maxPrice !== undefined && query.maxPrice !== null
          ? { price: { lte: query.maxPrice } }
          : {}),
      });
    }

    if (variantFilters.length === 1) {
      where.variants = { some: variantFilters[0] };
    } else if (variantFilters.length > 1) {
      where.AND = variantFilters.map((filter) => ({
        variants: { some: filter },
      }));
    }

    if (query.minRating !== undefined) {
      const ratedIds = await findProductIdsByMinRating(
        this.prisma,
        query.minRating,
        scope?.storeId ?? query.storeId,
      );
      where.id = { in: ratedIds.length > 0 ? ratedIds : [-1] };
    }

    return where;
  }

  public async findAllPaginated(
    query: QueryProductDto,
  ): Promise<PaginateQueryResult<ProductWithRelations>> {
    return this.paginate(query);
  }

  /** Seller-scoped listing — only products belonging to the seller's store. */
  public async findMinePaginated(
    userId: number,
    query: QueryProductDto,
  ): Promise<PaginateQueryResult<ProductWithRelations>> {
    const store =
      await this.productOwnershipProvider.findOwnedStoreOrThrow(userId);
    return this.paginate(query, { storeId: store.id, allowLifeCycle: true });
  }

  private resolveOrderBy(
    sort: QueryProductDto['sort'],
  ): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'oldest':
        return { createdAt: 'asc' };
      case 'price_asc':
        return { basePrice: 'asc' };
      case 'price_desc':
        return { basePrice: 'desc' };
      case 'name_asc':
        return { name: 'asc' };
      case 'rating_desc':
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }

  private async attachReviewStats(
    products: ProductWithRelations[],
  ): Promise<ProductWithRelations[]> {
    const stats = await getReviewStatsForProducts(
      this.prisma,
      products.map((p) => p.id),
    );

    return products.map((product) => {
      const row = stats.get(product.id);
      return {
        ...product,
        averageRating: row?.averageRating ?? 0,
        reviewCount: row?.totalReviews ?? 0,
      };
    });
  }

  private async paginate(
    query: QueryProductDto,
    scope?: { storeId?: number; allowLifeCycle?: boolean },
  ): Promise<PaginateQueryResult<ProductWithRelations>> {
    const { page, limit, skip } = this.paginationProviders.resolvePaging(query);
    const where = await this.buildWhere(query, scope);

    if (query.sort === 'rating_desc') {
      const allMatching = await this.prisma.product.findMany({
        where,
        select: { id: true },
      });
      const ids = allMatching.map((p) => p.id);
      const stats = await getReviewStatsForProducts(this.prisma, ids);
      const sortedIds = [...ids].sort((a, b) => {
        const ra = stats.get(a)?.averageRating ?? 0;
        const rb = stats.get(b)?.averageRating ?? 0;
        if (rb !== ra) return rb - ra;
        return b - a;
      });
      const pageIds = sortedIds.slice(skip, skip + limit);
      const products = await this.prisma.product.findMany({
        where: { id: { in: pageIds } },
        include: PRODUCT_LIST_INCLUDE,
      });
      const byId = new Map(
        products.map((p) => [p.id, mapProductToResponse(p)]),
      );
      const ordered = pageIds
        .map((id) => byId.get(id))
        .filter((p): p is ProductWithRelations => p != null);
      const withStats = await this.attachReviewStats(ordered);

      return {
        data: withStats,
        page,
        limit,
        total: ids.length,
      };
    }

    const total = await this.prisma.product.count({ where });
    const products = await this.prisma.product.findMany({
      where,
      include: PRODUCT_LIST_INCLUDE,
      orderBy: this.resolveOrderBy(query.sort),
      skip,
      take: limit,
    });

    const mapped = products.map((product) => mapProductToResponse(product));
    const withStats = await this.attachReviewStats(mapped);

    return {
      data: withStats,
      page,
      limit,
      total,
    };
  }

  public async findOne(id: number): Promise<ProductWithRelations> {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
        status: ProductStatus.ACTIVE,
      },
      include: PRODUCT_INCLUDE,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [mapped] = await this.attachReviewStats([
      mapProductToResponse(product),
    ]);
    return mapped;
  }

  public async findBySlug(slug: string): Promise<ProductWithRelations> {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: ProductStatus.ACTIVE,
      },
      include: PRODUCT_INCLUDE,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const [mapped] = await this.attachReviewStats([
      mapProductToResponse(product),
    ]);
    return mapped;
  }
}

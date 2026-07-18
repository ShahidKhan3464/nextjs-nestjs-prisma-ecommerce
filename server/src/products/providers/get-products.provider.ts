import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryProductDto } from '../dto/query-product.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { mapProductToResponse } from '../utils/map-product.util';
import { ProductWithRelations } from 'src/common/types/domain.types';
import { ProductOwnershipProvider } from './product-ownership.provider';
import { PaginationProviders } from 'src/common/pagination/providers/pagination.providers';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';
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

  private buildWhere(
    query: QueryProductDto,
    scope?: { storeId?: number; allowLifeCycle?: boolean },
  ): Prisma.ProductWhereInput {
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
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (scope?.storeId !== undefined) {
      if (query.status) {
        where.status = query.status;
      }
    } else {
      // Public catalog: only ACTIVE products; ignore client status/lifeCycle bypass.
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

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.variants = {
        some: {
          ...(query.minPrice !== undefined && query.minPrice !== null
            ? { price: { gte: query.minPrice } }
            : {}),
          ...(query.maxPrice !== undefined && query.maxPrice !== null
            ? { price: { lte: query.maxPrice } }
            : {}),
        },
      };
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

  private async paginate(
    query: QueryProductDto,
    scope?: { storeId?: number; allowLifeCycle?: boolean },
  ): Promise<PaginateQueryResult<ProductWithRelations>> {
    const { page, limit, skip } = this.paginationProviders.resolvePaging(query);
    const where = this.buildWhere(query, scope);

    const total = await this.prisma.product.count({ where });
    const products = await this.prisma.product.findMany({
      where,
      include: PRODUCT_LIST_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: products.map((product) => mapProductToResponse(product)),
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

    return mapProductToResponse(product);
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

    return mapProductToResponse(product);
  }
}

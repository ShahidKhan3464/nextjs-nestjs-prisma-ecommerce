import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { VariantOwnershipProvider } from './variant-ownership.provider';
import { VARIANT_INCLUDE } from '../constants/product-variant.constants';
import { QueryProductVariantDto } from '../dto/query-product-variant.dto';
import { ProductVariantWithRelations } from 'src/common/types/domain.types';
import { mapProductVariantToResponse } from '../utils/map-product-variant.util';
import { PaginationProviders } from 'src/common/pagination/providers/pagination.providers';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';

@Injectable()
export class GetProductVariantsProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationProviders: PaginationProviders,
    private readonly variantOwnershipProvider: VariantOwnershipProvider,
  ) {}

  private buildWhere(
    query: QueryProductVariantDto,
    scope?: { storeId?: number },
  ): Prisma.ProductVariantWhereInput {
    const where: Prisma.ProductVariantWhereInput = {
      product: {
        deletedAt: null,
        ...(scope?.storeId !== undefined
          ? { storeId: scope.storeId }
          : {
              status: 'ACTIVE',
              ...(query.storeId ? { storeId: query.storeId } : {}),
            }),
      },
    };

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.sku?.trim()) {
      where.sku = query.sku.trim();
    }

    if (query.color?.trim()) {
      where.color = {
        equals: query.color.trim(),
        mode: 'insensitive',
      };
    }

    if (query.size?.trim()) {
      where.size = {
        equals: query.size.trim(),
        mode: 'insensitive',
      };
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { sku: { contains: term, mode: 'insensitive' } },
        { color: { contains: term, mode: 'insensitive' } },
        { size: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (query.minStock !== undefined || query.maxStock !== undefined) {
      where.stockQuantity = {
        ...(query.minStock !== undefined ? { gte: query.minStock } : {}),
        ...(query.maxStock !== undefined ? { lte: query.maxStock } : {}),
      };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }

    return where;
  }

  public async findAllPaginated(
    query: QueryProductVariantDto,
  ): Promise<PaginateQueryResult<ProductVariantWithRelations>> {
    return this.paginate(query);
  }

  /** Seller-scoped listing — only variants for products in the seller's store. */
  public async findMinePaginated(
    userId: number,
    query: QueryProductVariantDto,
  ): Promise<PaginateQueryResult<ProductVariantWithRelations>> {
    const store =
      await this.variantOwnershipProvider.findOwnedStoreOrThrow(userId);
    return this.paginate(query, { storeId: store.id });
  }

  public async findByProductId(
    productId: number,
    query: QueryProductVariantDto,
  ): Promise<PaginateQueryResult<ProductVariantWithRelations>> {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.paginate({ ...query, productId });
  }

  private async paginate(
    query: QueryProductVariantDto,
    scope?: { storeId?: number },
  ): Promise<PaginateQueryResult<ProductVariantWithRelations>> {
    const { page, limit, skip } = this.paginationProviders.resolvePaging(query);
    const where = this.buildWhere(query, scope);

    const total = await this.prisma.productVariant.count({ where });
    const variants = await this.prisma.productVariant.findMany({
      where,
      include: VARIANT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: variants.map((variant) => mapProductVariantToResponse(variant)),
      page,
      limit,
      total,
    };
  }

  public async findOne(id: number): Promise<ProductVariantWithRelations> {
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        id,
        product: { deletedAt: null, status: 'ACTIVE' },
      },
      include: VARIANT_INCLUDE,
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    return mapProductVariantToResponse(variant);
  }
}

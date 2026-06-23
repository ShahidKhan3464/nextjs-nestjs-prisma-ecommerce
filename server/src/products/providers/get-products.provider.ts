import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryProductDto } from '../dto/query-product.dto';
import { ProductStatus } from '../constants/product.constants';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductWithRelations } from 'src/common/types/domain.types';
import { PaginationProviders } from 'src/common/pagination/providers/pagination.providers';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';
import {
  findProductWithImages,
  attachImagesToNestedProducts,
} from 'src/common/files/file-query.util';

@Injectable()
export class GetProductsProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationProviders: PaginationProviders,
  ) {}

  private buildWhere(query: QueryProductDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = {};

    if (query.lifeCycle === 'removed') {
      where.deletedAt = { not: null };
    } else if (query.lifeCycle !== 'all') {
      where.deletedAt = null;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.status) {
      where.status = query.status;
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
    const { page, limit, skip } = this.paginationProviders.resolvePaging(query);
    const where = this.buildWhere(query);

    const total = await this.prisma.product.count({ where });
    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const data = await attachImagesToNestedProducts(
      this.prisma,
      products.map((product) => ({
        ...product,
        basePrice: Number(product.basePrice),
        status: product.status as ProductStatus,
        variants: product.variants.map((variant) => ({
          ...variant,
          price: Number(variant.price),
        })),
      })),
    );

    return { data, page, limit, total };
  }

  public async findOne(id: number): Promise<ProductWithRelations> {
    const product = await findProductWithImages(this.prisma, {
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  public async findBySlug(slug: string): Promise<ProductWithRelations> {
    const product = await findProductWithImages(this.prisma, {
      where: { slug, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}

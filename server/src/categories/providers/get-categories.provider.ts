import { Category } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryCategoryDto } from '../dto/query-category.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationProviders } from 'src/common/pagination/providers/pagination.providers';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';

@Injectable()
export class GetCategoriesProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationProviders: PaginationProviders,
  ) {}

  private buildWhere(query: QueryCategoryDto) {
    if (query.lifeCycle === 'removed') {
      return {
        deletedAt: { not: null },
        ...(query.search?.trim()
          ? {
              name: {
                contains: query.search.trim(),
                mode: 'insensitive' as const,
              },
            }
          : {}),
      };
    }

    if (query.lifeCycle === 'all') {
      return query.search?.trim()
        ? {
            name: {
              contains: query.search.trim(),
              mode: 'insensitive' as const,
            },
          }
        : {};
    }

    return {
      deletedAt: null,
      ...(query.search?.trim()
        ? {
            name: {
              contains: query.search.trim(),
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };
  }

  public async findAllPaginated(
    query: QueryCategoryDto,
  ): Promise<PaginateQueryResult<Category>> {
    const { page, limit, skip } = this.paginationProviders.resolvePaging(query);
    const sortBy = query.sortBy ?? 'name';
    const sortOrder = query.sortOrder ?? 'ASC';
    const where = this.buildWhere(query);

    const total = await this.prisma.category.count({ where });
    const data = await this.prisma.category.findMany({
      where,
      orderBy: { [sortBy]: sortOrder.toLowerCase() as 'asc' | 'desc' },
      skip,
      take: limit,
    });

    return { data, page, limit, total };
  }

  public async findOne(id: number): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}

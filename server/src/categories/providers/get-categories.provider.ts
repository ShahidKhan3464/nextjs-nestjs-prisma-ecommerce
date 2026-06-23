import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from '../entities/category.entity';
import { QueryCategoryDto } from '../dto/query-category.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationProviders } from 'src/common/pagination/providers/pagination.providers';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';

@Injectable()
export class GetCategoriesProvider {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly paginationProviders: PaginationProviders,
  ) {}

  private buildFilteredQb(query: QueryCategoryDto) {
    const qb = this.categoryRepository.createQueryBuilder('category');

    if (query.lifeCycle === 'all' || query.lifeCycle === 'removed') {
      qb.withDeleted();
    }

    if (query.lifeCycle === 'removed') {
      qb.andWhere('category.deletedAt IS NOT NULL');
    }

    if (query.search?.trim()) {
      qb.andWhere('category.name ILIKE :search', {
        search: `%${query.search.trim()}%`,
      });
    }
    return qb;
  }

  public async findAllPaginated(
    query: QueryCategoryDto,
  ): Promise<PaginateQueryResult<Category>> {
    const { page, limit, skip } = this.paginationProviders.resolvePaging(query);
    const sortBy = query.sortBy ?? 'name';
    const sortOrder = query.sortOrder ?? 'ASC';

    const total = await this.buildFilteredQb(query).getCount();
    const data = await this.buildFilteredQb(query)
      .orderBy(`category.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getMany();

    return { data, page, limit, total };
  }

  public async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}

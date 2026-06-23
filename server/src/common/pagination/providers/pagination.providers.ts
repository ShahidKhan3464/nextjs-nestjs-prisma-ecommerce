import { Injectable } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginateQueryResult } from '../interfaces/paginated.interfaces';

@Injectable()
export class PaginationProviders {
  /** Normalized skip/take for TypeORM queries (shared across modules). */
  public resolvePaging(query: PaginationQueryDto): {
    page: number;
    limit: number;
    skip: number;
  } {
    const rawPage = Number(query.page);
    const rawLimit = Number(query.limit);
    const page =
      Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 10;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  public async paginateQuery<T extends ObjectLiteral>(
    query: PaginationQueryDto,
    repository: Repository<T>,
  ): Promise<PaginateQueryResult<T>> {
    const { limit, page, skip } = this.resolvePaging(query);
    const total = await repository.count();
    const data = await repository.find({
      skip,
      take: limit,
    });
    return {
      data,
      page,
      limit,
      total,
    };
  }
}

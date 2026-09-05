import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { PaginateQueryResult } from '../interfaces/paginated.interfaces';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_MAX_LIMIT,
} from '../constants/pagination.constants';

@Injectable()
export class PaginationProviders {
  /** Normalized skip/take for list queries (shared across modules). */
  public resolvePaging(query: PaginationQueryDto): {
    page: number;
    limit: number;
    skip: number;
  } {
    const rawPage = Number(query.page);
    const rawLimit = Number(query.limit);
    const page =
      Number.isFinite(rawPage) && rawPage > 0
        ? Math.floor(rawPage)
        : PAGINATION_DEFAULT_PAGE;
    const uncappedLimit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.floor(rawLimit)
        : PAGINATION_DEFAULT_LIMIT;
    const limit = Math.min(uncappedLimit, PAGINATION_MAX_LIMIT);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  public async paginateQuery<T>(
    query: PaginationQueryDto,
    countFn: () => Promise<number>,
    findFn: (skip: number, take: number) => Promise<T[]>,
  ): Promise<PaginateQueryResult<T>> {
    const { limit, page, skip } = this.resolvePaging(query);
    const total = await countFn();
    const data = await findFn(skip, limit);
    return {
      data,
      page,
      limit,
      total,
    };
  }
}

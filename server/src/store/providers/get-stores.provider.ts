import { Prisma } from 'src/generated/prisma/client';
import { QueryStoresDto } from '../dto/query-stores.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { StoreOwnershipProvider } from './store-ownership.provider';
import { StoreStatus, STORE_INCLUDE } from '../constants/store.constants';
import { StoreMapped, mapStoreToResponse } from '../utils/map-store.util';
import { PaginationProviders } from 'src/common/pagination/providers/pagination.providers';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';

@Injectable()
export class GetStoresProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationProvider: PaginationProviders,
    private readonly storeOwnershipProvider: StoreOwnershipProvider,
  ) {}

  public findMe(userId: number): Promise<StoreMapped> {
    return this.storeOwnershipProvider.findOwnedStoreOrThrow(userId);
  }

  public async findById(id: number): Promise<StoreMapped> {
    const store = await this.prisma.store.findFirst({
      where: { id, deletedAt: null },
      include: STORE_INCLUDE,
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return mapStoreToResponse(store);
  }

  public async findBySlug(slug: string): Promise<StoreMapped> {
    const store = await this.prisma.store.findFirst({
      where: {
        deletedAt: null,
        status: StoreStatus.ACTIVE,
        slug: slug.trim().toLowerCase(),
      },
      include: STORE_INCLUDE,
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return mapStoreToResponse(store);
  }

  public async findAllPaginated(
    query: QueryStoresDto,
  ): Promise<PaginateQueryResult<StoreMapped>> {
    const where: Prisma.StoreWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                slug: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const { limit, page, skip } = this.paginationProvider.resolvePaging(query);
    const total = await this.prisma.store.count({ where });
    const stores = await this.prisma.store.findMany({
      skip,
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: STORE_INCLUDE,
    });

    return {
      page,
      limit,
      total,
      data: stores.map((store) => mapStoreToResponse(store)),
    };
  }
}

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { SELLER_PROFILE_INCLUDE } from '../constants/seller.constants';
import { QuerySellerProfilesDto } from '../dto/query-seller-profiles.dto';
import { PaginationProviders } from 'src/common/pagination/providers/pagination.providers';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';
import {
  SellerProfileMapped,
  mapSellerProfileToResponse,
} from '../utils/map-seller-profile.util';

@Injectable()
export class GetSellerProfilesProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationProvider: PaginationProviders,
  ) {}

  public async findMe(userId: number): Promise<SellerProfileMapped> {
    const profile = await this.prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
      include: SELLER_PROFILE_INCLUDE,
    });
    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }
    return mapSellerProfileToResponse(profile);
  }

  public async findById(id: number): Promise<SellerProfileMapped> {
    const profile = await this.prisma.sellerProfile.findFirst({
      where: { id, deletedAt: null },
      include: SELLER_PROFILE_INCLUDE,
    });
    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }
    return mapSellerProfileToResponse(profile);
  }

  public async findAllPaginated(
    query: QuerySellerProfilesDto,
  ): Promise<PaginateQueryResult<SellerProfileMapped>> {
    const where: Prisma.SellerProfileWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                businessName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                businessEmail: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const { limit, page, skip } = this.paginationProvider.resolvePaging(query);
    const total = await this.prisma.sellerProfile.count({ where });
    const profiles = await this.prisma.sellerProfile.findMany({
      skip,
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: SELLER_PROFILE_INCLUDE,
    });

    return {
      page,
      limit,
      total,
      data: profiles.map((profile) => mapSellerProfileToResponse(profile)),
    };
  }
}

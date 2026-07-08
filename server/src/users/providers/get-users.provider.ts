import { QueryUserDto } from '../dto/query-user.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FileOwnerModule } from 'src/common/files/file.constants';
import { PaginationProviders } from 'src/common/pagination/providers/pagination.providers';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';
import {
  UserResponse,
  UserMeResponse,
  mapUserToResponse,
} from '../utils/map-user.util';

export type FindUsersQuery = Omit<QueryUserDto, 'isBlocked'> & {
  isBlocked?: boolean;
};

@Injectable()
export class GetUsersProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationProvider: PaginationProviders,
  ) {}

  public async findAllPaginated(
    query: FindUsersQuery,
  ): Promise<PaginateQueryResult<UserResponse>> {
    const where = {
      role: { not: UserRole.ADMIN },
      ...(query.isBlocked === true
        ? { isBlocked: true }
        : query.isBlocked === false
          ? { isBlocked: false }
          : {}),
      ...(query.search
        ? {
            OR: [
              {
                fullName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                email: { contains: query.search, mode: 'insensitive' as const },
              },
              {
                phoneNumber: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const { limit, page, skip } = this.paginationProvider.resolvePaging(query);
    const total = await this.prisma.user.count({ where });
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
    });

    return {
      data: users.map((user) => mapUserToResponse(user)),
      page,
      limit,
      total,
    };
  }

  public async findOne(id: number): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return mapUserToResponse(user);
  }

  public async findMeWithAvatar(id: number): Promise<UserMeResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const avatar = await this.prisma.storedFile.findFirst({
      where: { ownerModule: FileOwnerModule.CUSTOMER, ownerId: id },
      orderBy: { sortOrder: 'asc' },
    });
    return { ...mapUserToResponse(user), avatarUrl: avatar?.urlPath };
  }
}

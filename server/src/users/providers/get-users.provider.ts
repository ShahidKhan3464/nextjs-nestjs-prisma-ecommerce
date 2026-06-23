import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryUserDto } from '../dto/query-user.dto';
import { UserRole } from '../constants/user.constants';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FileOwnerModule } from 'src/common/files/file.constants';
import { StoredFile } from 'src/common/files/entities/stored-file.entity';
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(StoredFile)
    private readonly fileRepository: Repository<StoredFile>,
    private readonly paginationProvider: PaginationProviders,
  ) {}

  public async findAllPaginated(
    query: FindUsersQuery,
  ): Promise<PaginateQueryResult<UserResponse>> {
    const qb = this.userRepository.createQueryBuilder('user');

    // Exclude admins from the general user list
    qb.andWhere('user.role != :role', { role: UserRole.ADMIN });

    if (query.isBlocked === true) {
      qb.andWhere('user.isBlocked IS TRUE');
    } else if (query.isBlocked === false) {
      qb.andWhere('COALESCE(user.isBlocked, false) = false');
    }

    if (query.search) {
      qb.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search OR user.phoneNumber ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const { limit, page, skip } = this.paginationProvider.resolvePaging(query);
    const total = await qb.getCount();
    const users = await qb.skip(skip).take(limit).getMany();
    return {
      data: users.map(mapUserToResponse),
      page,
      limit,
      total,
    };
  }

  public async findOne(id: number): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return mapUserToResponse(user);
  }

  public async findMeWithAvatar(id: number): Promise<UserMeResponse> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const avatar = await this.fileRepository.findOne({
      where: { ownerModule: FileOwnerModule.CUSTOMER, ownerId: id },
      order: { sortOrder: 'ASC' },
    });
    return { ...mapUserToResponse(user), avatarUrl: avatar?.urlPath };
  }
}

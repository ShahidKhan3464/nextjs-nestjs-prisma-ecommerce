import { User } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserMeResponse, UserResponse } from './types/user.types';
import { BlockUserProvider } from './providers/block-user.provider';
import { UserWithRoles } from 'src/common/types/user-with-roles.type';
import { UpdateProfileProvider } from './providers/update-profile.provider';
import { ChangePasswordProvider } from './providers/change-password.provider';
import { USER_ROLES_INCLUDE } from 'src/common/constants/user-roles.constants';
import { UploadProfileAvatarProvider } from './providers/upload-profile-avatar.provider';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';
import {
  AUTH_USER_SELECT,
  AuthUserWithRoles,
} from 'src/common/constants/auth-user.constants';
import {
  UserDetailResponse,
  GetUserDetailProvider,
} from './providers/get-user-detail.provider';
import {
  FindUsersQuery,
  GetUsersProvider,
} from './providers/get-users.provider';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly getUsersProvider: GetUsersProvider,
    private readonly blockUserProvider: BlockUserProvider,
    private readonly getUserDetailProvider: GetUserDetailProvider,
    private readonly updateProfileProvider: UpdateProfileProvider,
    private readonly changePasswordProvider: ChangePasswordProvider,
    private readonly uploadProfileAvatarProvider: UploadProfileAvatarProvider,
  ) {}

  public async findAllPaginated(
    query: FindUsersQuery,
  ): Promise<PaginateQueryResult<UserResponse>> {
    return await this.getUsersProvider.findAllPaginated(query);
  }

  public async findOne(id: number): Promise<UserResponse> {
    return await this.getUsersProvider.findOne(id);
  }

  public async findMeWithAvatar(id: number): Promise<UserMeResponse> {
    return await this.getUsersProvider.findMeWithAvatar(id);
  }

  public async getUserDetail(id: number): Promise<UserDetailResponse> {
    return this.getUserDetailProvider.getDetail(id);
  }

  public async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<UserMeResponse> {
    return this.updateProfileProvider.update(userId, dto);
  }

  public async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.changePasswordProvider.change(userId, dto);
    return { message: 'Password updated' };
  }

  public async uploadAvatar(
    userId: number,
    roles: UserRole[],
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }
    const avatarUrl = await this.uploadProfileAvatarProvider.upload(
      userId,
      roles,
      file,
    );
    return { avatarUrl };
  }

  public async blockUser(
    id: number,
    isBlocked: boolean,
  ): Promise<UserResponse> {
    return await this.blockUserProvider.blockUser(id, isBlocked);
  }

  public async findOneById(id: number): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  public async findOneByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  public async findOneForAuthById(
    id: number,
  ): Promise<AuthUserWithRoles | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: AUTH_USER_SELECT,
    });
  }

  public async findOneByIdWithRoles(id: number): Promise<UserWithRoles | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: USER_ROLES_INCLUDE,
    });
  }

  public async findOneByEmailWithRoles(
    email: string,
  ): Promise<UserWithRoles | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: USER_ROLES_INCLUDE,
    });
  }

  public async updatePassword(id: number, password: string): Promise<void> {
    const result = await this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { password },
    });
    if (result.count === 0) {
      throw new NotFoundException('User not found');
    }
  }
}

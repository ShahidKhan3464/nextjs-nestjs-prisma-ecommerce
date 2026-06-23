import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BlockUserProvider } from './providers/block-user.provider';
import { UserMeResponse, UserResponse } from './utils/map-user.util';
import { CreateUserProvider } from './providers/create-user.provider.js';
import { UpdateProfileProvider } from './providers/update-profile.provider';
import { ChangePasswordProvider } from './providers/change-password.provider';
import { UploadProfileAvatarProvider } from './providers/upload-profile-avatar.provider';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';
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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly getUsersProvider: GetUsersProvider,
    private readonly blockUserProvider: BlockUserProvider,
    private readonly createUserProvider: CreateUserProvider,
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
  ): Promise<UserResponse> {
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
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }
    const avatarUrl = await this.uploadProfileAvatarProvider.upload(
      userId,
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

  public async createUser(dto: CreateUserDto): Promise<User> {
    return await this.createUserProvider.createUser(dto);
  }

  public async findOneById(id: number): Promise<User | null> {
    return await this.userRepository.findOneBy({ id });
  }

  public async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  public async updatePassword(
    id: number,
    password: string,
    confirmPassword: string,
  ): Promise<void> {
    const result = await this.userRepository.update(
      { id },
      { password, confirmPassword },
    );
    if (!result.affected) {
      throw new NotFoundException('User not found');
    }
  }
}

import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserResponse, mapUserToResponse } from '../utils/map-user.util';
import { USER_ROLES_INCLUDE } from 'src/common/constants/user-roles.constants';
import { RefreshTokenStoreProvider } from 'src/modules/auth/providers/refresh-token-store.provider';

@Injectable()
export class BlockUserProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshTokenStore: RefreshTokenStoreProvider,
  ) {}

  public async blockUser(
    id: number,
    isBlocked: boolean,
  ): Promise<UserResponse> {
    try {
      const saved = await this.prisma.user.update({
        where: { id },
        data: { isBlocked },
        include: USER_ROLES_INCLUDE,
      });

      if (isBlocked) {
        await this.refreshTokenStore.revokeAllForUser(id);
      }

      return mapUserToResponse(saved);
    } catch {
      throw new NotFoundException('User not found');
    }
  }
}

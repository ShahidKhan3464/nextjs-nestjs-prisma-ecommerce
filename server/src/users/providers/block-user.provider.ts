import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserResponse, mapUserToResponse } from '../utils/map-user.util';
import { USER_ROLES_INCLUDE } from 'src/common/constants/user-roles.constants';

@Injectable()
export class BlockUserProvider {
  constructor(private readonly prisma: PrismaService) {}

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
      return mapUserToResponse(saved);
    } catch {
      throw new NotFoundException('User not found');
    }
  }
}

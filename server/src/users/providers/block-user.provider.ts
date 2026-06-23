import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserResponse, mapUserToResponse } from '../utils/map-user.util';

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
      });
      return mapUserToResponse(saved);
    } catch {
      throw new NotFoundException('User not found');
    }
  }
}

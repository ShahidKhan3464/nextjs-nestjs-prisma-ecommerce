import { UserMeResponse } from '../types/user.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { mapUserToResponse } from '../utils/map-user.util';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { USER_ROLES_INCLUDE } from 'src/common/constants/user-roles.constants';

@Injectable()
export class UpdateProfileProvider {
  constructor(private readonly prisma: PrismaService) {}

  async update(userId: number, dto: UpdateProfileDto): Promise<UserMeResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const saved = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined
          ? { fullName: dto.fullName.trim() }
          : {}),
        ...(dto.phoneNumber !== undefined
          ? { phoneNumber: dto.phoneNumber.trim() }
          : {}),
      },
      include: USER_ROLES_INCLUDE,
    });

    const avatar = await this.prisma.userFile.findFirst({
      where: { userId, type: 'AVATAR' },
      orderBy: { sortOrder: 'asc' },
      include: { file: { select: { urlPath: true } } },
    });

    return { ...mapUserToResponse(saved), avatarUrl: avatar?.file.urlPath };
  }
}

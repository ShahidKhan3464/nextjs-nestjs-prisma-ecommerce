import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserResponse, mapUserToResponse } from '../utils/map-user.util';

@Injectable()
export class UpdateProfileProvider {
  constructor(private readonly prisma: PrismaService) {}

  async update(userId: number, dto: UpdateProfileDto): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
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
    });

    return mapUserToResponse(saved);
  }
}

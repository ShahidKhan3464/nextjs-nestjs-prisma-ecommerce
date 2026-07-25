import { PrismaService } from 'src/prisma/prisma.service';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { HashingProvider } from 'src/crypto/providers/hashing.provider';
import { RefreshTokenStoreProvider } from 'src/modules/auth/providers/refresh-token-store.provider';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ChangePasswordProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingProvider: HashingProvider,
    private readonly refreshTokenStore: RefreshTokenStoreProvider,
  ) {}

  async change(userId: number, dto: ChangePasswordDto): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await this.hashingProvider.verify(
      dto.currentPassword,
      user.password,
    );
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashed = await this.hashingProvider.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    await this.refreshTokenStore.revokeAllForUser(userId);
  }
}

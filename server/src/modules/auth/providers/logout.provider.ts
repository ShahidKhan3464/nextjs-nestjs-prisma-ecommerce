import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RefreshTokenStoreProvider } from './refresh-token-store.provider';

@Injectable()
export class LogoutProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshTokenStore: RefreshTokenStoreProvider,
  ) {}

  public async logout(dto: RefreshTokenDto): Promise<{ loggedOut: true }> {
    await this.refreshTokenStore.revokeToken(dto.refreshToken);
    return { loggedOut: true };
  }

  public async logoutAll(userId: number): Promise<{ loggedOut: true }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    await this.refreshTokenStore.revokeAllForUser(userId);
    return { loggedOut: true };
  }
}

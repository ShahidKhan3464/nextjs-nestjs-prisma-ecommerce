import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RefreshTokenStoreProvider {
  constructor(private readonly prisma: PrismaService) {}

  public hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  public createFamilyId(): string {
    return randomUUID();
  }

  public async persist(
    userId: number,
    refreshToken: string,
    familyId: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        expiresAt,
        tokenHash: this.hashToken(refreshToken),
      },
    });
  }

  public async findActiveByToken(refreshToken: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
    });
  }

  public async rotate(
    currentToken: string,
    newToken: string,
    expiresAt: Date,
  ): Promise<{ reused: boolean } | { rotated: true; familyId: string }> {
    const tokenHash = this.hashToken(currentToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!existing) {
      return { reused: false };
    }

    if (existing.revokedAt) {
      await this.revokeFamily(existing.familyId);
      return { reused: true };
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      await this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      });
      return { reused: false };
    }

    const newHash = this.hashToken(newToken);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: {
          revokedAt: new Date(),
          replacedByHash: newHash,
        },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: existing.userId,
          familyId: existing.familyId,
          tokenHash: newHash,
          expiresAt,
        },
      }),
    ]);

    return { rotated: true, familyId: existing.familyId };
  }

  public async revokeToken(refreshToken: string): Promise<void> {
    const existing = await this.findActiveByToken(refreshToken);
    if (!existing || existing.revokedAt) {
      return;
    }

    await this.revokeFamily(existing.familyId);
  }

  public async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public async revokeAllForUser(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

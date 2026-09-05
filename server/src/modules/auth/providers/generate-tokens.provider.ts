import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from 'src/config/jwt.config';
import type { SignOptions } from 'jsonwebtoken';
import type { ConfigType } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';
import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtTokenType } from '../constants/jwt-token-type.enum';
import { UserWithRoles } from 'src/common/types/user-with-roles.type';
import { jwtSignOptions } from '../constants/jwt-algorithm.constants';
import { extractUserRoles } from 'src/common/utils/authorization.util';
import { RefreshTokenStoreProvider } from './refresh-token-store.provider';

type AuthenticatedUserSummary = {
  id: number;
  email: string;
  fullName: string;
  roles: UserRole[];
  isBlocked: boolean;
};

@Injectable()
export class GenerateTokensProvider {
  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokenStore: RefreshTokenStoreProvider,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  public async signToken<T extends object>(
    userId: number,
    expiresIn: string,
    payload: T & { typ: JwtTokenType },
  ) {
    const options = jwtSignOptions(this.secretFor(payload.typ), expiresIn);
    return await this.jwtService.signAsync(
      { ...payload, sub: userId },
      {
        ...options,
        expiresIn: expiresIn as SignOptions['expiresIn'],
      },
    );
  }

  private secretFor(typ: JwtTokenType): string {
    switch (typ) {
      case JwtTokenType.ACCESS:
        return this.jwtConfiguration.accessSecret;
      case JwtTokenType.REFRESH:
        return this.jwtConfiguration.refreshSecret;
      case JwtTokenType.PASSWORD_RESET:
        return this.jwtConfiguration.resetSecret;
    }
  }

  public async generateTokens(user: UserWithRoles) {
    const roles = extractUserRoles(user);
    const familyId = this.refreshTokenStore.createFamilyId();
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user.id, this.jwtConfiguration.accessTokenTtl, {
        email: user.email,
        roles,
        tokenVersion: user.tokenVersion,
        typ: JwtTokenType.ACCESS,
      }),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl, {
        typ: JwtTokenType.REFRESH,
        familyId,
      }),
    ]);

    const expiresAt = this.resolveExpiryDate(
      this.jwtConfiguration.refreshTokenTtl,
    );
    await this.refreshTokenStore.persist(
      user.id,
      refreshToken,
      familyId,
      expiresAt,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        roles,
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isBlocked: user.isBlocked,
      } satisfies AuthenticatedUserSummary,
    };
  }

  public async rotateRefreshToken(
    user: UserWithRoles,
    familyId: string,
    currentRefreshToken: string,
  ) {
    const roles = extractUserRoles(user);
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user.id, this.jwtConfiguration.accessTokenTtl, {
        email: user.email,
        roles,
        tokenVersion: user.tokenVersion,
        typ: JwtTokenType.ACCESS,
      }),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl, {
        typ: JwtTokenType.REFRESH,
        familyId,
      }),
    ]);

    const expiresAt = this.resolveExpiryDate(
      this.jwtConfiguration.refreshTokenTtl,
    );
    const result = await this.refreshTokenStore.rotate(
      currentRefreshToken,
      refreshToken,
      expiresAt,
    );

    if ('reused' in result) {
      return { reused: result.reused };
    }

    return {
      accessToken,
      refreshToken,
      user: {
        roles,
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isBlocked: user.isBlocked,
      } satisfies AuthenticatedUserSummary,
    };
  }

  public async signPasswordResetToken(
    userId: number,
    passwordHash: string,
  ): Promise<string> {
    return this.signToken(userId, '1h', {
      typ: JwtTokenType.PASSWORD_RESET,
      pwd: createHash('sha256').update(passwordHash).digest('hex'),
    });
  }

  private resolveExpiryDate(ttl: string): Date {
    const match = /^(\d+)([smhd])$/i.exec(ttl.trim());
    const now = Date.now();
    if (!match) {
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(now + amount * (multipliers[unit] ?? multipliers.d));
  }
}

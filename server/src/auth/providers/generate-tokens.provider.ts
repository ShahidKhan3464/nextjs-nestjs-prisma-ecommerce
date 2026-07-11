import { JwtService } from '@nestjs/jwt';
import jwtConfig from 'src/config/jwt.config';
import type { SignOptions } from 'jsonwebtoken';
import type { ConfigType } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UserWithRoles } from 'src/common/types/user-with-roles.type';
import { extractUserRoles } from 'src/common/utils/authorization.util';

export type AuthenticatedUserSummary = {
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
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  public async signToken<T extends object>(
    userId: number,
    expiresIn: string,
    payload?: T,
  ) {
    return await this.jwtService.signAsync(
      { ...(payload ?? {}), sub: userId },
      {
        expiresIn: expiresIn as SignOptions['expiresIn'],
        secret: this.jwtConfiguration.secret,
      },
    );
  }

  public async generateTokens(user: UserWithRoles) {
    const roles = extractUserRoles(user);
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user.id, this.jwtConfiguration.accessTokenTtl, {
        email: user.email,
        roles,
      }),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl),
    ]);
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
}

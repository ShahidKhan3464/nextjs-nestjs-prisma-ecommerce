import { JwtService } from '@nestjs/jwt';
import jwtConfig from '../config/jwt.config';
import type { SignOptions } from 'jsonwebtoken';
import type { ConfigType } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';
import type { User } from 'src/generated/prisma/client';

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

  public async generateTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken(user.id, this.jwtConfiguration.accessTokenTtl, {
        email: user.email,
        role: user.role,
      }),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl),
    ]);
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        fullName: user.fullName,
        isBlocked: user.isBlocked,
      },
    };
  }
}

import { JwtService } from '@nestjs/jwt';
import jwtConfig from 'src/config/jwt.config';
import type { ConfigType } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtTokenType } from '../constants/jwt-token-type.enum';
import { GenerateTokensProvider } from './generate-tokens.provider';
import { JwtRefreshTokenPayload } from 'src/common/types/jwt-payload.type';
import { RefreshTokenStoreProvider } from './refresh-token-store.provider';
import { ACCOUNT_BLOCKED_MESSAGE } from '../constants/auth-messages.constants';
import {
  Inject,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class RefreshTokensProvider {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly generateTokensProvider: GenerateTokensProvider,
    private readonly refreshTokenStore: RefreshTokenStoreProvider,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  public async refreshTokens(dto: RefreshTokenDto) {
    let payload: JwtRefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtRefreshTokenPayload>(
        dto.refreshToken,
        { secret: this.jwtConfiguration.secret },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (
      payload.typ !== JwtTokenType.REFRESH ||
      !payload.familyId ||
      !Number.isFinite(Number(payload.sub))
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.refreshTokenStore.findActiveByToken(
      dto.refreshToken,
    );

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.revokedAt) {
      await this.refreshTokenStore.revokeFamily(stored.familyId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = Number(payload.sub);
    const user = await this.usersService.findOneByIdWithRoles(userId);

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (user.isBlocked) {
      await this.refreshTokenStore.revokeAllForUser(userId);
      throw new ForbiddenException(ACCOUNT_BLOCKED_MESSAGE);
    }

    const rotated = await this.generateTokensProvider.rotateRefreshToken(
      user,
      stored.familyId,
      dto.refreshToken,
    );

    if ('reused' in rotated) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return rotated;
  }
}

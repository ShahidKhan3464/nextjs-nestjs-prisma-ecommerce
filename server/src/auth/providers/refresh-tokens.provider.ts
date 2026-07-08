import { JwtService } from '@nestjs/jwt';
import jwtConfig from 'src/config/jwt.config';
import type { ConfigType } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ACCOUNT_BLOCKED_MESSAGE } from './login.provider';
import { GenerateTokensProvider } from './generate-tokens.provider';
import {
  Inject,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

interface RefreshTokenPayload {
  sub: number;
}

@Injectable()
export class RefreshTokensProvider {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly generateTokensProvider: GenerateTokensProvider,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  public async refreshTokens(dto: RefreshTokenDto) {
    try {
      const { refreshToken } = dto;
      const { sub } = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.jwtConfiguration.secret,
        },
      );
      const user = await this.usersService.findOneById(sub);
      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      if (user.isBlocked) {
        throw new ForbiddenException(ACCOUNT_BLOCKED_MESSAGE);
      }
      return await this.generateTokensProvider.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException(error as Error);
    }
  }
}

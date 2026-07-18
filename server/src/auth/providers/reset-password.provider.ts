import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { JwtTokenType } from '../constants/jwt-token-type.enum';
import { HashingProvider } from 'src/crypto/providers/hashing.provider';
import { RefreshTokenStoreProvider } from './refresh-token-store.provider';
import { JwtPasswordResetPayload } from 'src/common/types/jwt-payload.type';
import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  RequestTimeoutException,
} from '@nestjs/common';

@Injectable()
export class ResetPasswordProvider {
  private readonly logger = new Logger(ResetPasswordProvider.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly hashingProvider: HashingProvider,
    private readonly refreshTokenStore: RefreshTokenStoreProvider,
  ) {}

  public async resetPassword(dto: ResetPasswordDto): Promise<{ reset: true }> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const secret = this.configService.getOrThrow<string>('jwt.secret');
    let payload: JwtPasswordResetPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPasswordResetPayload>(
        dto.token,
        { secret },
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Reset token verification failed: ${detail}`);
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    if (payload.typ !== JwtTokenType.PASSWORD_RESET) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    const userId = Number(payload.sub);
    if (!Number.isFinite(userId)) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    const passwordHash = await this.hashingProvider.hash(dto.password);

    try {
      await this.usersService.updatePassword(userId, passwordHash);
      await this.refreshTokenStore.revokeAllForUser(userId);
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new RequestTimeoutException(
        'Unable to process your request at the moment',
        { description: 'Error connecting to the database' },
      );
    }

    return { reset: true };
  }
}

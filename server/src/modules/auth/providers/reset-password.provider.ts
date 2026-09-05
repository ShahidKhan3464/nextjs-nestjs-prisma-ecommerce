import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UsersService } from 'src/modules/users/users.service';
import { JwtTokenType } from '../constants/jwt-token-type.enum';
import { jwtVerifyOptions } from '../constants/jwt-algorithm.constants';
import { RefreshTokenStoreProvider } from './refresh-token-store.provider';
import { JwtPasswordResetPayload } from 'src/common/types/jwt-payload.type';
import { HashingProvider } from 'src/common/crypto/providers/hashing.provider';
import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ServiceUnavailableException,
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

    const secret = this.configService.getOrThrow<string>('jwt.resetSecret');
    let payload: JwtPasswordResetPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPasswordResetPayload>(
        dto.token,
        jwtVerifyOptions(secret),
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Reset token verification failed: ${detail}`);
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    if (payload.typ !== JwtTokenType.PASSWORD_RESET || !payload.pwd) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    const userId = Number(payload.sub);
    if (!Number.isFinite(userId)) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    const user = await this.usersService.findOneById(userId);
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    const passwordFingerprint = createHash('sha256')
      .update(user.password)
      .digest('hex');
    if (payload.pwd !== passwordFingerprint) {
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
      throw new ServiceUnavailableException(
        'Unable to process your request at the moment',
      );
    }

    return { reset: true };
  }
}

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { HashingProvider } from 'src/crypto/providers/hashing.provider';
import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  RequestTimeoutException,
} from '@nestjs/common';

const PASSWORD_RESET_PURPOSE = 'password-reset';

@Injectable()
export class ResetPasswordProvider {
  private readonly logger = new Logger(ResetPasswordProvider.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async resetPassword(dto: ResetPasswordDto): Promise<{ reset: true }> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const secret = this.configService.getOrThrow<string>('jwt.secret');
    let payload: { sub?: unknown; purpose?: unknown };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub: number;
        purpose: string;
      }>(dto.token, { secret });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Reset token verification failed: ${detail}`);
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    if (
      payload.purpose !== PASSWORD_RESET_PURPOSE ||
      payload.sub === undefined ||
      payload.sub === null
    ) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    const userId = Number(payload.sub);
    if (!Number.isFinite(userId)) {
      throw new UnauthorizedException('Invalid or expired reset link');
    }

    const passwordHash = await this.hashingProvider.hash(dto.password);
    const confirmPasswordHash = await this.hashingProvider.hash(
      dto.confirmPassword,
    );

    try {
      await this.usersService.updatePassword(
        userId,
        passwordHash,
        confirmPasswordHash,
      );
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

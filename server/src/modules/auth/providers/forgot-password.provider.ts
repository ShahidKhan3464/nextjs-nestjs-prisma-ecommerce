import { ConfigService } from '@nestjs/config';
import { User } from 'src/generated/prisma/client';
import { UsersService } from 'src/modules/users/users.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { MailService } from 'src/integrations/mail/mail.service';
import { GenerateTokensProvider } from './generate-tokens.provider';
import {
  Logger,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class ForgotPasswordProvider {
  private readonly logger = new Logger(ForgotPasswordProvider.name);

  constructor(
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {}

  public async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ sent: boolean }> {
    let user: User | null;
    try {
      user = await this.usersService.findOneByEmail(dto.email);
    } catch {
      throw new ServiceUnavailableException(
        'Unable to process your request at the moment',
      );
    }

    // Always return the same response to avoid email enumeration.
    if (!user || user.deletedAt || user.isBlocked) {
      return { sent: true };
    }

    const token = await this.generateTokensProvider.signPasswordResetToken(
      user.id,
      user.password,
    );

    const base = (
      this.configService.get<string>('app.frontendUrl') ??
      'http://localhost:3000'
    ).replace(/\/$/, '');
    const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;

    try {
      await this.mailService.sendResetPasswordEmail(
        user.email,
        user.fullName,
        resetUrl,
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Password reset email failed for ${user.email}: ${detail}`,
      );
      // Do not leak whether the account exists via SMTP failures.
      return { sent: true };
    }

    return { sent: true };
  }
}

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/providers/mail.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import {
  Logger,
  Injectable,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';

@Injectable()
export class ForgotPasswordProvider {
  private readonly logger = new Logger(ForgotPasswordProvider.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  public async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ sent: boolean }> {
    let user: User | null;
    try {
      user = await this.usersService.findOneByEmail(dto.email);
    } catch {
      throw new RequestTimeoutException(
        'Unable to process your request at the moment',
        { description: 'Error connecting to the database' },
      );
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const secret = this.configService.getOrThrow<string>('jwt.secret');
    const token = await this.jwtService.signAsync(
      { sub: user.id, purpose: 'password-reset' },
      { expiresIn: '1h', secret },
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
      throw err;
    }

    return { sent: true };
  }
}

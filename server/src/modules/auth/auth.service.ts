import { LoginDto } from './dto/login.dto';
import { Injectable } from '@nestjs/common';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LogoutProvider } from './providers/logout.provider';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RegisterProvider } from './providers/register.provider';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { LoggedInUser, LoginProvider } from './providers/login.provider';
import { ResetPasswordProvider } from './providers/reset-password.provider';
import { RefreshTokensProvider } from './providers/refresh-tokens.provider';
import { ForgotPasswordProvider } from './providers/forgot-password.provider';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginProvider: LoginProvider,
    private readonly logoutProvider: LogoutProvider,
    private readonly registerProvider: RegisterProvider,
    private readonly refreshTokensProvider: RefreshTokensProvider,
    private readonly resetPasswordProvider: ResetPasswordProvider,
    private readonly forgotPasswordProvider: ForgotPasswordProvider,
  ) {}

  public async register(dto: CreateUserDto) {
    return await this.registerProvider.register(dto);
  }

  public async login(dto: LoginDto): Promise<{ user: LoggedInUser }> {
    return await this.loginProvider.login(dto);
  }

  public async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ sent: boolean }> {
    return await this.forgotPasswordProvider.forgotPassword(dto);
  }

  public async resetPassword(dto: ResetPasswordDto): Promise<{ reset: true }> {
    return await this.resetPasswordProvider.resetPassword(dto);
  }

  public async refreshTokens(
    dto: RefreshTokenDto,
  ): Promise<{ user: LoggedInUser }> {
    const { accessToken, refreshToken, user } =
      await this.refreshTokensProvider.refreshTokens(dto);
    return {
      user: {
        accessToken,
        refreshToken,
        ...user,
      },
    };
  }

  public async logout(dto: RefreshTokenDto): Promise<{ loggedOut: true }> {
    return this.logoutProvider.logout(dto);
  }
}

import { LoginDto } from './dto/login.dto';
import { Injectable } from '@nestjs/common';
import { User } from 'src/generated/prisma/client';
import { UsersService } from 'src/users/users.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoggedInUser, LoginProvider } from './providers/login.provider';
import { ResetPasswordProvider } from './providers/reset-password.provider';
import { RefreshTokensProvider } from './providers/refresh-tokens.provider';
import { ForgotPasswordProvider } from './providers/forgot-password.provider';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly loginProvider: LoginProvider,
    private readonly refreshTokensProvider: RefreshTokensProvider,
    private readonly resetPasswordProvider: ResetPasswordProvider,
    private readonly forgotPasswordProvider: ForgotPasswordProvider,
  ) {}

  public async register(dto: CreateUserDto): Promise<{
    user: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'isBlocked'>;
  }> {
    const user = await this.usersService.createUser(dto);
    return {
      user: {
        id: user.id,
        role: user.role,
        email: user.email,
        fullName: user.fullName,
        isBlocked: user.isBlocked,
      },
    };
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
}

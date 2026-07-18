import { ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './constants/auth.constants';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Auth(AuthType.NONE)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.NONE)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.NONE)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.NONE)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.NONE)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.NONE)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto);
  }
}

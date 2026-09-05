import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './constants/auth.constants';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { CreateUserDto } from 'src/modules/users/dto/create-user.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token-response.dto';
import { ApiTags, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Auth(AuthType.NONE)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiCreatedResponse({ type: RegisterResponseDto })
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.NONE)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOkResponse({ type: LoginResponseDto })
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
  @ApiOkResponse({ type: RefreshTokenResponseDto })
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

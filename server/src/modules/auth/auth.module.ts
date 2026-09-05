import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthTokensModule } from './auth-tokens.module';
import { LoginProvider } from './providers/login.provider';
import { LogoutProvider } from './providers/logout.provider';
import { UsersModule } from 'src/modules/users/users.module';
import { CryptoModule } from 'src/common/crypto/crypto.module';
import { RegisterProvider } from './providers/register.provider';
import { RefreshTokensProvider } from './providers/refresh-tokens.provider';
import { AccessTokenGuard } from './guards/access-token/access-token.guard';
import { ResetPasswordProvider } from './providers/reset-password.provider';
import { GenerateTokensProvider } from './providers/generate-tokens.provider';
import { ForgotPasswordProvider } from './providers/forgot-password.provider';
import { AuthenticationGuard } from './guards/authentication/authentication.guard';

@Module({
  providers: [
    AuthService,
    LoginProvider,
    LogoutProvider,
    RegisterProvider,
    AccessTokenGuard,
    RefreshTokensProvider,
    ResetPasswordProvider,
    GenerateTokensProvider,
    ForgotPasswordProvider,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
  ],
  controllers: [AuthController],
  imports: [
    UsersModule,
    PrismaModule,
    CryptoModule,
    AuthTokensModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
  exports: [AuthTokensModule, GenerateTokensProvider],
})
export class AuthModule {}

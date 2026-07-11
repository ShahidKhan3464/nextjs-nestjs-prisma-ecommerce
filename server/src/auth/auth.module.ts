import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { CryptoModule } from 'src/crypto/crypto.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LoginProvider } from './providers/login.provider';
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
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
})
export class AuthModule {}

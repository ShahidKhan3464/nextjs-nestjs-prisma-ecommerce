import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from 'src/config/jwt.config';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { RolesGuard } from './guards/roles/roles.guard';
import { CryptoModule } from 'src/crypto/crypto.module';
import { LoginProvider } from './providers/login.provider';
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
    AccessTokenGuard,
    RefreshTokensProvider,
    ResetPasswordProvider,
    GenerateTokensProvider,
    ForgotPasswordProvider,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [AuthController],
  imports: [
    UsersModule,
    CryptoModule,
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
  ],
})
export class AuthModule {}

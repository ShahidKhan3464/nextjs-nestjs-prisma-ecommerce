import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import jwtConfig from './config/jwt.config';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { CryptoModule } from 'src/crypto/crypto.module';
import { LoginProvider } from './providers/login.provider';
import { RefreshTokensProvider } from './providers/refresh-tokens.provider';
import { ResetPasswordProvider } from './providers/reset-password.provider';
import { GenerateTokensProvider } from './providers/generate-tokens.provider';
import { ForgotPasswordProvider } from './providers/forgot-password.provider';

@Module({
  providers: [
    AuthService,
    LoginProvider,
    RefreshTokensProvider,
    ResetPasswordProvider,
    GenerateTokensProvider,
    ForgotPasswordProvider,
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

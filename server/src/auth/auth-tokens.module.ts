import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RefreshTokenStoreProvider } from './providers/refresh-token-store.provider';

@Module({
  imports: [PrismaModule],
  providers: [RefreshTokenStoreProvider],
  exports: [RefreshTokenStoreProvider],
})
export class AuthTokensModule {}

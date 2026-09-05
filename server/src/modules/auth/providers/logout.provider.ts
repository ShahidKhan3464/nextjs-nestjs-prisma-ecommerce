import { Injectable } from '@nestjs/common';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RefreshTokenStoreProvider } from './refresh-token-store.provider';

@Injectable()
export class LogoutProvider {
  constructor(private readonly refreshTokenStore: RefreshTokenStoreProvider) {}

  public async logout(dto: RefreshTokenDto): Promise<{ loggedOut: true }> {
    await this.refreshTokenStore.revokeToken(dto.refreshToken);
    return { loggedOut: true };
  }
}

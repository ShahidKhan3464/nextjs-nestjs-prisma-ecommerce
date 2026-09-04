import { createHash } from 'crypto';
import { JwtTokenType } from '../constants/jwt-token-type.enum';
import { GenerateTokensProvider } from './generate-tokens.provider';

describe('GenerateTokensProvider password-reset binding', () => {
  const jwtService = { signAsync: jest.fn() };
  const refreshTokenStore = {
    createFamilyId: jest.fn(),
    persist: jest.fn(),
    rotate: jest.fn(),
  };
  const jwtConfiguration = {
    secret: 'secret',
    accessTokenTtl: '15m',
    refreshTokenTtl: '7d',
  };

  const provider = new GenerateTokensProvider(
    jwtService as never,
    refreshTokenStore as never,
    jwtConfiguration,
  );

  it('embeds a fingerprint of the current password hash', async () => {
    jwtService.signAsync.mockResolvedValue('token');
    const passwordHash = 'bcrypt-hash';
    await provider.signPasswordResetToken(7, passwordHash);

    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 7,
        typ: JwtTokenType.PASSWORD_RESET,
        pwd: createHash('sha256').update(passwordHash).digest('hex'),
      }),
      expect.any(Object),
    );
  });

  it('changes the fingerprint when the password hash changes', async () => {
    jwtService.signAsync.mockResolvedValue('token');
    await provider.signPasswordResetToken(7, 'hash-a');
    await provider.signPasswordResetToken(7, 'hash-b');
    const calls = jwtService.signAsync.mock.calls as unknown as Array<
      [{ pwd?: string }]
    >;
    const first = calls[0]?.[0]?.pwd;
    const second = calls[1]?.[0]?.pwd;
    expect(first).not.toBe(second);
  });
});

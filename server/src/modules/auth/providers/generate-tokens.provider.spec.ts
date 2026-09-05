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
    secret: 'access-secret-value-for-tests-32ch',
    accessSecret: 'access-secret-value-for-tests-32ch',
    refreshSecret: 'refresh-secret-value-for-tests-32ch',
    resetSecret: 'reset-secret-value-for-tests-32chhh',
    accessTokenTtl: '15m',
    refreshTokenTtl: '7d',
    signOptions: { algorithm: 'HS256' as const },
    verifyOptions: { algorithms: ['HS256'] as ['HS256'] },
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
      expect.objectContaining({
        secret: jwtConfiguration.resetSecret,
        algorithm: 'HS256',
      }),
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

  it('signs each token type with its own secret', async () => {
    jwtService.signAsync.mockReset();
    jwtService.signAsync.mockResolvedValue('token');

    await provider.signToken(1, '15m', { typ: JwtTokenType.ACCESS });
    await provider.signToken(1, '7d', { typ: JwtTokenType.REFRESH });
    await provider.signToken(1, '1h', { typ: JwtTokenType.PASSWORD_RESET });

    const secrets = (
      jwtService.signAsync.mock.calls as unknown as Array<
        [unknown, { secret?: string }]
      >
    ).map((call) => call[1]?.secret);

    expect(secrets).toEqual([
      jwtConfiguration.accessSecret,
      jwtConfiguration.refreshSecret,
      jwtConfiguration.resetSecret,
    ]);
    expect(new Set(secrets).size).toBe(3);
  });
});

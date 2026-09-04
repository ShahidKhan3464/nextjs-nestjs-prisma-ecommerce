import { UnauthorizedException } from '@nestjs/common';
import { JwtTokenType } from '../../constants/jwt-token-type.enum';
import { AccessTokenGuard } from './access-token.guard';

describe('AccessTokenGuard', () => {
  const jwtService = { verifyAsync: jest.fn() };
  const usersService = { findOneForAuthById: jest.fn() };
  const jwtConfiguration = { secret: 'test-secret' };

  const guard = new AccessTokenGuard(
    jwtService as never,
    usersService as never,
    jwtConfiguration as never,
  );

  const context = (auth?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: auth ? { authorization: auth } : {},
        }),
      }),
    }) as never;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects missing bearer tokens', async () => {
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects refresh tokens presented as access tokens', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      typ: JwtTokenType.REFRESH,
      sub: '1',
    });

    await expect(
      guard.canActivate(context('Bearer refresh.jwt')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(usersService.findOneForAuthById).not.toHaveBeenCalled();
  });

  it('rejects unknown users', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      typ: JwtTokenType.ACCESS,
      sub: '1',
    });
    usersService.findOneForAuthById.mockResolvedValue(null);

    await expect(
      guard.canActivate(context('Bearer access.jwt')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

import { BadRequestException } from '@nestjs/common';
import { ChangePasswordProvider } from './change-password.provider';

describe('ChangePasswordProvider', () => {
  const prisma = {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const hashingProvider = {
    verify: jest.fn(),
    hash: jest.fn(),
  };
  const refreshTokenStore = {
    revokeAllForUser: jest.fn(),
  };

  const provider = new ChangePasswordProvider(
    prisma as never,
    hashingProvider as never,
    refreshTokenStore as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('increments tokenVersion and revokes refresh tokens', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 3,
      password: 'old-hash',
      deletedAt: null,
    });
    hashingProvider.verify.mockResolvedValue(true);
    hashingProvider.hash.mockResolvedValue('new-hash');
    prisma.user.update.mockResolvedValue({ id: 3 });

    await provider.change(3, {
      currentPassword: 'old',
      newPassword: 'new-password',
      confirmPassword: 'new-password',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { password: 'new-hash', tokenVersion: { increment: 1 } },
    });
    expect(refreshTokenStore.revokeAllForUser).toHaveBeenCalledWith(3);
  });

  it('rejects an incorrect current password', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 3,
      password: 'old-hash',
      deletedAt: null,
    });
    hashingProvider.verify.mockResolvedValue(false);

    await expect(
      provider.change(3, {
        currentPassword: 'wrong',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

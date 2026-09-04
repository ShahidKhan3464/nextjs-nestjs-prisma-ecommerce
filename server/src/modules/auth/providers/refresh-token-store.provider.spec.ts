import { RefreshTokenStoreProvider } from './refresh-token-store.provider';

describe('RefreshTokenStoreProvider', () => {
  const prisma = {
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const store = new RefreshTokenStoreProvider(prisma as never);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('hashes tokens with sha256', () => {
    const hash = store.hashToken('refresh-token');
    expect(hash).toHaveLength(64);
    expect(hash).toBe(store.hashToken('refresh-token'));
    expect(hash).not.toBe(store.hashToken('other'));
  });

  it('revokes the whole family when a revoked token is reused', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 1,
      familyId: 'fam-1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });

    const result = await store.rotate(
      'old-token',
      'new-token',
      new Date(Date.now() + 86_400_000),
    );

    expect(result).toEqual({ reused: true });
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { familyId: 'fam-1', revokedAt: null },
      }),
    );
  });

  it('rotates an active token in a transaction', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 1,
      userId: 9,
      familyId: 'fam-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prisma.$transaction.mockResolvedValue([{}, {}]);

    const result = await store.rotate(
      'old-token',
      'new-token',
      new Date(Date.now() + 86_400_000),
    );

    expect(result).toEqual({ rotated: true, familyId: 'fam-1' });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

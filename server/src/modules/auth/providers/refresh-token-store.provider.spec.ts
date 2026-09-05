import { RefreshTokenStoreProvider } from './refresh-token-store.provider';

describe('RefreshTokenStoreProvider', () => {
  const tx = {
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
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
    prisma.$transaction.mockImplementation(
      async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
    );
  });

  it('hashes tokens with sha256', () => {
    const hash = store.hashToken('refresh-token');
    expect(hash).toHaveLength(64);
    expect(hash).toBe(store.hashToken('refresh-token'));
    expect(hash).not.toBe(store.hashToken('other'));
  });

  it('revokes the whole family when a revoked token is reused', async () => {
    tx.refreshToken.findUnique.mockResolvedValue({
      id: 1,
      familyId: 'fam-1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });
    tx.refreshToken.updateMany.mockResolvedValue({ count: 2 });

    const result = await store.rotate(
      'old-token',
      'new-token',
      new Date(Date.now() + 86_400_000),
    );

    expect(result).toEqual({ reused: true });
    expect(tx.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { familyId: 'fam-1', revokedAt: null },
      }),
    );
    expect(tx.refreshToken.create).not.toHaveBeenCalled();
  });

  it('rotates an active token with an atomic conditional update', async () => {
    tx.refreshToken.findUnique.mockResolvedValue({
      id: 1,
      userId: 9,
      familyId: 'fam-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    tx.refreshToken.updateMany.mockResolvedValue({ count: 1 });
    tx.refreshToken.create.mockResolvedValue({});

    const result = await store.rotate(
      'old-token',
      'new-token',
      new Date(Date.now() + 86_400_000),
    );

    expect(result).toEqual({ rotated: true, familyId: 'fam-1' });
    expect(tx.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1, revokedAt: null },
        data: expect.objectContaining({
          replacedByHash: store.hashToken('new-token'),
        }),
      }),
    );
    expect(tx.refreshToken.create).toHaveBeenCalled();
  });

  it('lets only one concurrent rotate consume the same active token', async () => {
    tx.refreshToken.findUnique.mockResolvedValue({
      id: 1,
      userId: 9,
      familyId: 'fam-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    tx.refreshToken.updateMany.mockResolvedValue({ count: 0 });

    const result = await store.rotate(
      'old-token',
      'new-token',
      new Date(Date.now() + 86_400_000),
    );

    expect(result).toEqual({ reused: false });
    expect(tx.refreshToken.create).not.toHaveBeenCalled();
  });
});

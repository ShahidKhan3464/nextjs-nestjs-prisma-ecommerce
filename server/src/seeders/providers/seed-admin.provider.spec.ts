import { UserRole } from 'src/common/enums/user-role.enum';
import { SeedAdminProvider } from './seed-admin.provider';

describe('SeedAdminProvider', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userRole: { create: jest.fn() },
  };
  const hashingProvider = {
    hash: jest.fn().mockResolvedValue('hashed'),
  };
  const configValues: Record<string, unknown> = {};
  const configService = {
    get: jest.fn((key: string) => configValues[key]),
  };

  const provider = new SeedAdminProvider(
    configService as never,
    prisma as never,
    hashingProvider as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    hashingProvider.hash.mockResolvedValue('hashed');
    for (const key of Object.keys(configValues)) {
      delete configValues[key];
    }
    configService.get.mockImplementation((key: string) => configValues[key]);
  });

  it('does not seed or promote an admin on production startup', async () => {
    configValues.NODE_ENV = 'production';
    configValues.ALLOW_ADMIN_SEED = true;
    configValues.ADMIN_EMAIL = 'admin@example.com';
    configValues.ADMIN_PASSWORD = 'Password1!';

    await provider.onApplicationBootstrap();

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(prisma.userRole.create).not.toHaveBeenCalled();
  });

  it('does not seed in development unless ALLOW_ADMIN_SEED is explicit', async () => {
    configValues.NODE_ENV = 'development';
    configValues.ADMIN_EMAIL = 'admin@example.com';
    configValues.ADMIN_PASSWORD = 'Password1!';

    await provider.onApplicationBootstrap();

    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('seeds an admin in development when explicitly enabled', async () => {
    configValues.NODE_ENV = 'development';
    configValues.ALLOW_ADMIN_SEED = true;
    configValues.ADMIN_EMAIL = 'admin@example.com';
    configValues.ADMIN_PASSWORD = 'Password1!';
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 1 });

    await provider.onApplicationBootstrap();

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'admin@example.com',
          userRoles: { create: { role: UserRole.SUPER_ADMIN } },
        }),
      }),
    );
  });
});

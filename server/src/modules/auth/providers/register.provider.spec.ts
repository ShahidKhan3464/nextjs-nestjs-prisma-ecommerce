import { UserRole } from 'src/common/enums/user-role.enum';
import { RegisterProvider } from './register.provider';

describe('RegisterProvider', () => {
  const tx = {
    userRole: { create: jest.fn() },
    user: { findUnique: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn(),
    user: { findUnique: jest.fn() },
  };
  const createUserProvider = {
    createUser: jest.fn(),
    sendWelcomeEmail: jest.fn(),
  };

  const provider = new RegisterProvider(
    prisma as never,
    createUserProvider as never,
  );

  const dto = {
    email: 'buyer@example.com',
    fullName: 'Buyer Name',
    password: 'Password1!',
    confirmPassword: 'Password1!',
  };

  const publicSuccessBody = {
    user: {
      id: 4,
      email: dto.email,
      fullName: dto.fullName,
      isBlocked: false,
      roles: [UserRole.BUYER],
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
    );
  });

  it('returns the created user on successful registration', async () => {
    createUserProvider.createUser.mockResolvedValue({
      created: true,
      user: { id: 4, email: dto.email, fullName: dto.fullName },
    });
    tx.user.findUnique.mockResolvedValue({
      id: 4,
      email: dto.email,
      fullName: dto.fullName,
      isBlocked: false,
      userRoles: [{ role: UserRole.BUYER }],
    });

    const result = await provider.register(dto);

    expect(result).toEqual(publicSuccessBody);
    expect(createUserProvider.sendWelcomeEmail).toHaveBeenCalled();
  });

  it('is indistinguishable from success when the email already exists', async () => {
    createUserProvider.createUser.mockResolvedValue({
      created: false,
      id: 4,
    });

    const result = await provider.register(dto);

    expect(result).toEqual(publicSuccessBody);
    expect(Object.keys(result.user).sort()).toEqual(
      ['email', 'fullName', 'id', 'isBlocked', 'roles'].sort(),
    );
    expect(createUserProvider.sendWelcomeEmail).not.toHaveBeenCalled();
    expect(tx.userRole.create).not.toHaveBeenCalled();
  });

  it('does not return stored name, roles, or blocked status for an existing account', async () => {
    createUserProvider.createUser.mockResolvedValue({
      created: false,
      id: 12,
    });

    const result = await provider.register({
      ...dto,
      fullName: 'Name From Request',
    });

    expect(result).toEqual({
      user: {
        id: 12,
        email: dto.email,
        fullName: 'Name From Request',
        isBlocked: false,
        roles: [UserRole.BUYER],
      },
    });
  });

  it('treats an email unique-constraint race as a non-enumerating success', async () => {
    prisma.$transaction.mockRejectedValue({ code: 'P2002' });
    prisma.user.findUnique.mockResolvedValue({ id: 4 });

    const result = await provider.register(dto);

    expect(result).toEqual(publicSuccessBody);
    expect(createUserProvider.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('does not swallow unique conflicts for a new email', async () => {
    prisma.$transaction.mockRejectedValue({ code: 'P2002' });
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(provider.register(dto)).rejects.toEqual({ code: 'P2002' });
  });
});

import { BadRequestException } from '@nestjs/common';
import { CreateUserProvider } from './create-user.provider';

describe('CreateUserProvider', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  const mailService = {
    sendWelcomeEmail: jest.fn(),
  };
  const hashingProvider = {
    hash: jest.fn(),
  };

  const provider = new CreateUserProvider(
    prisma as never,
    mailService as never,
    hashingProvider as never,
  );

  const dto = {
    email: 'buyer@example.com',
    fullName: 'Buyer Name',
    password: 'Password1!',
    confirmPassword: 'Password1!',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    hashingProvider.hash.mockResolvedValue('hashed');
  });

  it('creates a new user when the email is unused', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 4,
      email: dto.email,
      fullName: dto.fullName,
    });

    const result = await provider.createUser(dto);

    expect(result).toEqual({
      created: true,
      user: expect.objectContaining({ id: 4, email: dto.email }),
    });
    expect(prisma.user.create).toHaveBeenCalled();
    expect(mailService.sendWelcomeEmail).toHaveBeenCalledWith(
      dto.email,
      dto.fullName,
    );
  });

  it('does not reveal that an email is registered', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 9, email: dto.email });

    const result = await provider.createUser(dto);

    expect(result).toEqual({ created: false, id: 9 });
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(mailService.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it('still hashes the password when the email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 9, email: dto.email });

    await provider.createUser(dto);

    expect(hashingProvider.hash).toHaveBeenCalledWith(dto.password);
  });

  it('rejects mismatched passwords', async () => {
    await expect(
      provider.createUser({
        ...dto,
        confirmPassword: 'OtherPass1!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

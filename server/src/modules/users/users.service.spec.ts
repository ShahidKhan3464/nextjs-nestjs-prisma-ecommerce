import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService.updatePassword', () => {
  const prisma = {
    user: { updateMany: jest.fn() },
  };

  const service = new UsersService(
    prisma as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('increments tokenVersion when resetting a password', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 1 });

    await service.updatePassword(9, 'hashed');

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 9, deletedAt: null },
      data: { password: 'hashed', tokenVersion: { increment: 1 } },
    });
  });

  it('throws when the user is missing', async () => {
    prisma.user.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.updatePassword(9, 'hashed')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

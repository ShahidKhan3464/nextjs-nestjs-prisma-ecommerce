import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from 'src/common/enums/user-role.enum';
import { ProductOwnershipProvider } from './product-ownership.provider';
import { StoreStatus } from 'src/modules/stores/constants/store.constants';
import { SellerProfileStatus } from 'src/modules/sellers/constants/seller.constants';

describe('ProductOwnershipProvider', () => {
  const prisma = {
    store: { findFirst: jest.fn() },
    product: { findFirst: jest.fn() },
  };

  const provider = new ProductOwnershipProvider(prisma as never);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('ignores client storeId and uses the authenticated seller store', async () => {
    prisma.store.findFirst.mockResolvedValue({
      id: 9,
      status: StoreStatus.ACTIVE,
      deletedAt: null,
      sellerProfile: {
        id: 1,
        userId: 42,
        status: SellerProfileStatus.APPROVED,
        businessName: 'Mine',
      },
    });

    const store = await provider.resolveStoreForCreate(
      42,
      [UserRole.SELLER],
      999,
    );
    expect(store.id).toBe(9);
    expect(prisma.store.findFirst).toHaveBeenCalled();
  });

  it('forbids seller A from managing seller B product', async () => {
    prisma.product.findFirst.mockResolvedValue({
      id: 1,
      deletedAt: null,
      store: {
        status: StoreStatus.ACTIVE,
        deletedAt: null,
        sellerProfile: {
          userId: 2,
          status: SellerProfileStatus.APPROVED,
        },
      },
    });

    await expect(
      provider.assertCanManage(1, 1, [UserRole.SELLER]),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows the owning approved seller to manage the product', async () => {
    const product = {
      id: 1,
      deletedAt: null,
      store: {
        status: StoreStatus.ACTIVE,
        deletedAt: null,
        sellerProfile: {
          userId: 1,
          status: SellerProfileStatus.APPROVED,
        },
      },
    };
    prisma.product.findFirst.mockResolvedValue(product);

    await expect(
      provider.assertCanManage(1, 1, [UserRole.SELLER]),
    ).resolves.toEqual(product);
  });

  it('throws when the seller has no store', async () => {
    prisma.store.findFirst.mockResolvedValue(null);
    await expect(provider.findOwnedStoreOrThrow(1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

import { ForbiddenException } from '@nestjs/common';
import { UserRole } from 'src/common/enums/user-role.enum';
import { OrderOwnershipProvider } from './order-ownership.provider';
import type { OrderWithRelations } from 'src/common/types/domain.types';
import { OrderStatus } from 'src/common/enums/order-status.enum';

function order(
  overrides: Partial<OrderWithRelations> = {},
): OrderWithRelations {
  return {
    id: 1,
    userId: 10,
    storeId: 5,
    orderNumber: 'ORD-1',
    status: OrderStatus.PENDING,
    totalAmount: 10,
    subtotal: 10,
    tax: 0,
    shippingAddress: '{}',
    cancellationReason: null,
    shippedAt: null,
    deliveredAt: null,
    cancelledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    checkoutSessionId: 1,
    ...overrides,
  };
}

describe('OrderOwnershipProvider', () => {
  const prisma = { store: { findFirst: jest.fn() } };
  const provider = new OrderOwnershipProvider(prisma as never);

  it('lets a buyer view their own order', () => {
    expect(() =>
      provider.assertCanView(order(), 10, [UserRole.BUYER]),
    ).not.toThrow();
  });

  it('blocks a buyer from another user order', () => {
    expect(() => provider.assertCanView(order(), 99, [UserRole.BUYER])).toThrow(
      ForbiddenException,
    );
  });

  it('lets SUPER_ADMIN view any order', () => {
    expect(() =>
      provider.assertCanView(order(), 99, [UserRole.SUPER_ADMIN]),
    ).not.toThrow();
  });

  it('lets a seller view orders for their store only', () => {
    expect(() =>
      provider.assertCanView(order(), 3, [UserRole.SELLER], 5),
    ).not.toThrow();
    expect(() =>
      provider.assertCanView(order(), 3, [UserRole.SELLER], 99),
    ).toThrow(ForbiddenException);
  });

  it('only the buyer or admin may cancel', () => {
    expect(() =>
      provider.assertCanCancel(order(), 10, [UserRole.BUYER]),
    ).not.toThrow();
    expect(() =>
      provider.assertCanCancel(order(), 3, [UserRole.SELLER]),
    ).toThrow(ForbiddenException);
    expect(() =>
      provider.assertCanCancel(order(), 1, [UserRole.SUPER_ADMIN]),
    ).not.toThrow();
  });
});

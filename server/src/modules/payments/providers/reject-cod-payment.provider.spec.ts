import { UserRole } from 'src/common/enums/user-role.enum';
import { OrderStatus } from 'src/modules/orders/constants/order.constants';
import { PaymentProvider, PaymentStatus } from '../constants/payment.constants';
import { RejectCodPaymentProvider } from './reject-cod-payment.provider';
import { findPaymentWithOrder } from '../utils/payment-query.util';
import { adjustVariantStock } from 'src/modules/orders/utils/adjust-variant-stock.util';

jest.mock('../utils/payment-query.util', () => ({
  findPaymentWithOrder: jest.fn(),
}));

jest.mock('src/modules/orders/utils/adjust-variant-stock.util', () => ({
  adjustVariantStock: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../utils/map-payment.util', () => ({
  mapPaymentToResponse: (payment: { id: number }) => payment,
}));

describe('RejectCodPaymentProvider', () => {
  const tx = {
    order: { updateMany: jest.fn() },
    orderItem: { findMany: jest.fn() },
  };

  const prisma = {
    $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };

  const auditProvider = { record: jest.fn() };
  const paymentOwnershipProvider = {
    findOwnedStoreId: jest.fn().mockResolvedValue(5),
    assertCanManageCod: jest.fn(),
  };
  const paymentLifecycleProvider = {
    markFailedMany: jest.fn().mockResolvedValue(1),
  };

  const provider = new RejectCodPaymentProvider(
    prisma as never,
    auditProvider as never,
    paymentOwnershipProvider as never,
    paymentLifecycleProvider as never,
  );

  const payment = {
    id: 9,
    orderId: 4,
    provider: PaymentProvider.COD,
    status: PaymentStatus.PENDING,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (findPaymentWithOrder as jest.Mock).mockResolvedValue(payment);
    paymentOwnershipProvider.findOwnedStoreId.mockResolvedValue(5);
    tx.order.updateMany.mockResolvedValue({ count: 1 });
    tx.orderItem.findMany.mockResolvedValue([{ variantId: 2, quantity: 1 }]);
  });

  it('cancels the pending order and releases reserved stock', async () => {
    await provider.reject(9, 1, [UserRole.SELLER], 'out of stock');

    const updateCalls = tx.order.updateMany.mock.calls as unknown as Array<
      [
        {
          where: { id: number; status: string };
          data: { status: string; cancellationReason: string };
        },
      ]
    >;
    expect(updateCalls[0]?.[0]?.where).toEqual({
      id: 4,
      status: OrderStatus.PENDING,
    });
    expect(updateCalls[0]?.[0]?.data.status).toBe(OrderStatus.CANCELLED);
    expect(updateCalls[0]?.[0]?.data.cancellationReason).toBe('out of stock');
    expect(adjustVariantStock).toHaveBeenCalledWith(
      tx,
      [{ variantId: 2, quantity: 1 }],
      'release',
    );
    expect(paymentLifecycleProvider.markFailedMany).toHaveBeenCalled();
  });

  it('does not release stock when the order was already claimed', async () => {
    tx.order.updateMany.mockResolvedValue({ count: 0 });

    await provider.reject(9, 1, [UserRole.SELLER]);

    expect(adjustVariantStock).not.toHaveBeenCalled();
    expect(paymentLifecycleProvider.markFailedMany).toHaveBeenCalled();
  });
});

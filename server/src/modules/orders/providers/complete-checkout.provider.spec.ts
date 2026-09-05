import { CompleteCheckoutProvider } from './complete-checkout.provider';
import {
  CheckoutSessionStatus,
  OrderStatus,
} from '../constants/order.constants';
import {
  findCheckoutSessionWithImages,
  findOrdersWithImages,
} from 'src/common/prisma/file-query.util';
import { mapOrderToResponse } from '../utils/map-order.util';

jest.mock('src/common/prisma/file-query.util', () => ({
  findCheckoutSessionWithImages: jest.fn(),
  findOrdersWithImages: jest.fn(),
}));

jest.mock('../utils/map-order.util', () => ({
  mapOrderToResponse: jest.fn((order: { id: number }) => ({
    id: String(order.id),
  })),
}));

describe('CompleteCheckoutProvider webhook vs client race', () => {
  const prisma = {
    payment: { findMany: jest.fn() },
    cartItem: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };

  const stripeService = {
    retrievePaymentIntent: jest.fn(),
  };

  const paymentLifecycleProvider = {
    markSucceededMany: jest.fn().mockResolvedValue(1),
  };

  const provider = new CompleteCheckoutProvider(
    prisma as never,
    { sendOrderConfirmationEmail: jest.fn() } as never,
    { findOneById: jest.fn() } as never,
    stripeService as never,
    { create: jest.fn().mockResolvedValue({}) } as never,
    paymentLifecycleProvider as never,
  );

  const paymentIntent = {
    id: 'pi_1',
    status: 'succeeded',
    amount_received: 1000,
    currency: 'usd',
    metadata: { userId: '5', checkoutSessionId: '9' },
    payment_method: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    stripeService.retrievePaymentIntent.mockResolvedValue(paymentIntent);
  });

  it('returns already-completed orders without writing again', async () => {
    prisma.payment.findMany.mockResolvedValue([{ orderId: 1 }]);
    (findOrdersWithImages as jest.Mock).mockResolvedValue([{ id: 1 }]);
    prisma.cartItem.deleteMany.mockResolvedValue({ count: 0 });

    const result = await provider.completeFromWebhook('pi_1');

    expect(result.orders).toEqual([{ id: '1' }]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(paymentLifecycleProvider.markSucceededMany).not.toHaveBeenCalled();
    expect(mapOrderToResponse).toHaveBeenCalled();
  });

  it('treats a lost session claim as a successful race with the other completer', async () => {
    prisma.payment.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          orderId: 2,
          order: { userId: 5, status: OrderStatus.PENDING, items: [] },
        },
      ])
      .mockResolvedValueOnce([{ orderId: 2 }]);

    (findCheckoutSessionWithImages as jest.Mock).mockResolvedValue({
      id: 9,
      stripePaymentIntentId: 'pi_1',
      totalAmount: 10,
      status: CheckoutSessionStatus.PENDING,
    });

    prisma.$transaction.mockImplementation(
      async (
        fn: (tx: {
          checkoutSession: { updateMany: jest.Mock };
        }) => Promise<void>,
      ) => {
        const tx = {
          checkoutSession: {
            updateMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        };
        await fn(tx);
      },
    );

    (findOrdersWithImages as jest.Mock).mockResolvedValue([{ id: 2 }]);
    prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });

    const result = await provider.complete(5, { paymentIntentId: 'pi_1' });

    expect(result.orders).toEqual([{ id: '2' }]);
    expect(paymentLifecycleProvider.markSucceededMany).not.toHaveBeenCalled();
  });

  it('marks payments succeeded when this completer wins the session claim', async () => {
    prisma.payment.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        orderId: 3,
        order: { userId: 5, status: OrderStatus.PENDING, items: [] },
      },
    ]);

    (findCheckoutSessionWithImages as jest.Mock).mockResolvedValue({
      id: 9,
      stripePaymentIntentId: 'pi_1',
      totalAmount: 10,
      status: CheckoutSessionStatus.PENDING,
    });

    const tx = {
      checkoutSession: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      cartItem: { deleteMany: jest.fn() },
    };

    prisma.$transaction.mockImplementation(
      async (fn: (client: typeof tx) => Promise<void>) => fn(tx),
    );
    (findOrdersWithImages as jest.Mock).mockResolvedValue([{ id: 3 }]);

    const result = await provider.completeFromWebhook('pi_1');

    expect(tx.checkoutSession.updateMany).toHaveBeenCalledWith({
      where: { id: 9, status: CheckoutSessionStatus.PENDING },
      data: { status: CheckoutSessionStatus.COMPLETED },
    });
    expect(paymentLifecycleProvider.markSucceededMany).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ orderIds: [3] }),
    );
    expect(result.orders).toEqual([{ id: '3' }]);
  });
});

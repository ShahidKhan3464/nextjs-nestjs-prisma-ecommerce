import { ExpireAbandonedCheckoutsProvider } from './expire-abandoned-checkouts.provider';
import { CheckoutSessionStatus } from '../constants/order.constants';
import { adjustVariantStock } from '../utils/adjust-variant-stock.util';

jest.mock('../utils/adjust-variant-stock.util', () => ({
  adjustVariantStock: jest.fn().mockResolvedValue(undefined),
}));

describe('ExpireAbandonedCheckoutsProvider', () => {
  const tx = {
    checkoutSession: { updateMany: jest.fn() },
    order: { findMany: jest.fn(), deleteMany: jest.fn() },
    orderItem: { findMany: jest.fn() },
    payment: { findMany: jest.fn() },
    checkoutSessionItem: { findMany: jest.fn() },
  };

  const prisma = {
    checkoutSession: { findMany: jest.fn() },
    $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };

  const stripeService = {
    retrievePaymentIntent: jest.fn(),
    cancelPaymentIntent: jest.fn(),
  };

  const jobLock = {
    runExclusive: jest.fn(
      async (_name: string, _ttl: number, fn: () => Promise<number>) => fn(),
    ),
  };

  const provider = new ExpireAbandonedCheckoutsProvider(
    prisma as never,
    stripeService as never,
    jobLock as never,
  );

  const staleSession = {
    id: 7,
    userId: 3,
    createdAt: new Date(Date.now() - 40 * 60 * 1000),
    stripePaymentIntentId: 'pi_stale',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.checkoutSession.findMany.mockResolvedValue([staleSession]);
    tx.order.findMany.mockResolvedValue([{ id: 11 }]);
    tx.orderItem.findMany.mockResolvedValue([{ variantId: 4, quantity: 2 }]);
    tx.order.deleteMany.mockResolvedValue({ count: 1 });
    tx.checkoutSessionItem.findMany.mockResolvedValue([]);
  });

  it('does not expire sessions whose PaymentIntent succeeded', async () => {
    stripeService.retrievePaymentIntent.mockResolvedValue({
      status: 'succeeded',
    });

    await expect(provider.expireStale()).resolves.toBe(0);
    expect(tx.checkoutSession.updateMany).not.toHaveBeenCalled();
    expect(adjustVariantStock).not.toHaveBeenCalled();
  });

  it('does not expire sessions whose PaymentIntent is processing', async () => {
    stripeService.retrievePaymentIntent.mockResolvedValue({
      status: 'processing',
    });

    await expect(provider.expireStale()).resolves.toBe(0);
    expect(tx.checkoutSession.updateMany).not.toHaveBeenCalled();
  });

  it('does not expire when PaymentIntent lookup fails', async () => {
    stripeService.retrievePaymentIntent.mockRejectedValue(
      new Error('stripe down'),
    );

    await expect(provider.expireStale()).resolves.toBe(0);
    expect(tx.checkoutSession.updateMany).not.toHaveBeenCalled();
    expect(adjustVariantStock).not.toHaveBeenCalled();
  });

  it('does not expire when cancel loses a race with a succeeded payment', async () => {
    stripeService.retrievePaymentIntent
      .mockResolvedValueOnce({ status: 'requires_payment_method' })
      .mockResolvedValueOnce({ status: 'succeeded' });
    stripeService.cancelPaymentIntent.mockRejectedValue(new Error('paid'));

    await expect(provider.expireStale()).resolves.toBe(0);
    expect(tx.checkoutSession.updateMany).not.toHaveBeenCalled();
    expect(adjustVariantStock).not.toHaveBeenCalled();
  });

  it('claims a pending session once and releases reserved stock', async () => {
    stripeService.retrievePaymentIntent.mockResolvedValue({
      status: 'requires_payment_method',
    });
    stripeService.cancelPaymentIntent.mockResolvedValue({});
    tx.checkoutSession.updateMany.mockResolvedValue({ count: 1 });

    await expect(provider.expireStale()).resolves.toBe(1);
    expect(tx.checkoutSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: 7,
        status: CheckoutSessionStatus.PENDING,
      },
      data: { status: CheckoutSessionStatus.EXPIRED },
    });
    expect(adjustVariantStock).toHaveBeenCalledWith(
      tx,
      [{ variantId: 4, quantity: 2 }],
      'release',
    );
    expect(tx.order.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [11] } },
    });
  });

  it('does not release stock when another worker already claimed the session', async () => {
    stripeService.retrievePaymentIntent.mockResolvedValue({
      status: 'requires_payment_method',
    });
    tx.checkoutSession.updateMany.mockResolvedValue({ count: 0 });

    await expect(provider.expireStale()).resolves.toBe(0);
    expect(adjustVariantStock).not.toHaveBeenCalled();
    expect(tx.order.deleteMany).not.toHaveBeenCalled();
  });
});

import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CancelCheckoutProvider } from './cancel-checkout.provider';
import { CheckoutSessionStatus } from '../constants/order.constants';
import { adjustVariantStock } from '../utils/adjust-variant-stock.util';

jest.mock('../utils/adjust-variant-stock.util', () => ({
  adjustVariantStock: jest.fn().mockResolvedValue(undefined),
}));

describe('CancelCheckoutProvider', () => {
  const tx = {
    checkoutSession: { updateMany: jest.fn() },
    order: { findMany: jest.fn(), deleteMany: jest.fn() },
    orderItem: { findMany: jest.fn() },
    payment: { findMany: jest.fn() },
  };

  const prisma = {
    checkoutSession: { findFirst: jest.fn() },
    $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
      fn(tx),
    ),
  };

  const stripeService = {
    retrievePaymentIntent: jest.fn(),
    cancelPaymentIntent: jest.fn(),
  };

  const provider = new CancelCheckoutProvider(
    prisma as never,
    stripeService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.checkoutSession.findFirst.mockResolvedValue({
      id: 8,
      userId: 2,
      status: CheckoutSessionStatus.PENDING,
      stripePaymentIntentId: 'pi_1',
    });
    stripeService.retrievePaymentIntent.mockResolvedValue({
      status: 'requires_payment_method',
    });
    stripeService.cancelPaymentIntent.mockResolvedValue({});
    tx.order.findMany.mockResolvedValue([{ id: 15 }]);
    tx.orderItem.findMany.mockResolvedValue([{ variantId: 3, quantity: 1 }]);
    tx.order.deleteMany.mockResolvedValue({ count: 1 });
  });

  it('claims the session before releasing stock', async () => {
    tx.checkoutSession.updateMany.mockResolvedValue({ count: 1 });

    await provider.cancel('pi_1', 2);

    expect(tx.checkoutSession.updateMany).toHaveBeenCalledWith({
      where: { id: 8, status: CheckoutSessionStatus.PENDING },
      data: { status: CheckoutSessionStatus.CANCELLED },
    });
    expect(adjustVariantStock).toHaveBeenCalledWith(
      tx,
      [{ variantId: 3, quantity: 1 }],
      'release',
    );
  });

  it('does not release stock when the session was already completed', async () => {
    tx.checkoutSession.updateMany.mockResolvedValue({ count: 0 });

    await expect(provider.cancel('pi_1', 2)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(adjustVariantStock).not.toHaveBeenCalled();
    expect(tx.order.deleteMany).not.toHaveBeenCalled();
  });

  it('refuses to cancel after Stripe reports succeeded', async () => {
    stripeService.retrievePaymentIntent.mockResolvedValue({
      status: 'succeeded',
    });

    await expect(provider.cancel('pi_1', 2)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('does not release stock when payment succeeds during cancel', async () => {
    stripeService.retrievePaymentIntent
      .mockResolvedValueOnce({ status: 'requires_payment_method' })
      .mockResolvedValueOnce({ status: 'succeeded' });
    stripeService.cancelPaymentIntent.mockRejectedValue(new Error('paid'));

    await expect(provider.cancel('pi_1', 2)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(adjustVariantStock).not.toHaveBeenCalled();
  });

  it('does not release stock when Stripe status cannot be verified', async () => {
    stripeService.retrievePaymentIntent.mockRejectedValue(
      new Error('stripe down'),
    );

    await expect(provider.cancel('pi_1', 2)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

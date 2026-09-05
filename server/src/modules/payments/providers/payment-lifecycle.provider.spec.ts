import { BadRequestException } from '@nestjs/common';
import { PaymentStatus } from '../constants/payment.constants';
import { PaymentLifecycleProvider } from './payment-lifecycle.provider';

describe('PaymentLifecycleProvider.applyRefund', () => {
  const provider = new PaymentLifecycleProvider();
  const tx = {
    $queryRaw: jest.fn(),
    payment: { update: jest.fn() },
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('locks the payment row and records a partial refund in cents', async () => {
    tx.$queryRaw.mockResolvedValue([
      {
        id: 9,
        amount: '20.00',
        refundedAmount: '0.10',
        status: PaymentStatus.SUCCEEDED,
        externalRefundId: null,
      },
    ]);
    tx.payment.update.mockResolvedValue({});

    await provider.applyRefund(tx as never, {
      paymentId: 9,
      amount: 0.2,
      reason: 'partial',
    });

    expect(JSON.stringify(tx.$queryRaw.mock.calls[0])).toContain('FOR UPDATE');
    expect(tx.payment.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: expect.objectContaining({
        status: PaymentStatus.PARTIALLY_REFUNDED,
        refundedAmount: '0.30',
        refundReason: 'partial',
      }),
    });
  });

  it('rejects a concurrent-style over-refund after lock', async () => {
    tx.$queryRaw.mockResolvedValue([
      {
        id: 9,
        amount: '10.00',
        refundedAmount: '8.00',
        status: PaymentStatus.PARTIALLY_REFUNDED,
        externalRefundId: null,
      },
    ]);

    await expect(
      provider.applyRefund(tx as never, {
        paymentId: 9,
        amount: 3,
        reason: 'too much',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.payment.update).not.toHaveBeenCalled();
  });
});

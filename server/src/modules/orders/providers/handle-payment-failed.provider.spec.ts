import { HandlePaymentFailedProvider } from './handle-payment-failed.provider';
import { PaymentStatus } from '../constants/order.constants';

describe('HandlePaymentFailedProvider', () => {
  const prisma = {
    payment: { updateMany: jest.fn() },
  };

  const provider = new HandlePaymentFailedProvider(prisma as never);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.payment.updateMany.mockResolvedValue({ count: 1 });
  });

  it('records a retryable failure without marking the payment FAILED', async () => {
    await provider.handle({
      id: 'pi_fail',
      last_payment_error: { message: 'Your card was declined' },
    } as never);

    expect(prisma.payment.updateMany).toHaveBeenCalledWith({
      where: {
        transactionId: 'pi_fail',
        status: {
          in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
        },
      },
      data: {
        status: PaymentStatus.PROCESSING,
        failureReason: 'Your card was declined',
      },
    });
  });
});

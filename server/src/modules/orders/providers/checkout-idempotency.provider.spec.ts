import { ConflictException } from '@nestjs/common';
import { CheckoutIdempotencyProvider } from './checkout-idempotency.provider';
import { hashCheckoutRequest } from '../utils/checkout-idempotency.util';
import type { ShippingAddressDto } from '../dto/create-checkout.dto';

const address: ShippingAddressDto = {
  fullName: 'Jane Doe',
  line1: '123 Market',
  city: 'NYC',
  region: 'NY',
  postalCode: '10001',
  country: 'US',
};

describe('CheckoutIdempotencyProvider', () => {
  const prisma = {
    checkoutIdempotencyKey: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const provider = new CheckoutIdempotencyProvider(prisma as never);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns proceed when the key is new', async () => {
    prisma.checkoutIdempotencyKey.create.mockResolvedValue({ id: 1 });
    await expect(
      provider.begin(1, 'key-1', hashCheckoutRequest(address)),
    ).resolves.toBe('proceed');
  });

  it('returns the stored response for the same key and body', async () => {
    const hash = hashCheckoutRequest(address);
    const stored = {
      clientSecret: 'sec',
      paymentIntentId: 'pi_1',
      checkoutSessionId: '9',
      orderIds: ['1'],
      preview: { tax: 0, total: 10, subtotal: 10 },
    };
    prisma.checkoutIdempotencyKey.create.mockRejectedValue({ code: 'P2002' });
    prisma.checkoutIdempotencyKey.findUnique.mockResolvedValue({
      id: 1,
      requestHash: hash,
      responseJson: stored,
      createdAt: new Date(),
      completedAt: new Date(),
    });

    await expect(provider.begin(1, 'key-1', hash)).resolves.toEqual(stored);
  });

  it('conflicts when the same key is reused with a different body', async () => {
    prisma.checkoutIdempotencyKey.create.mockRejectedValue({ code: 'P2002' });
    prisma.checkoutIdempotencyKey.findUnique.mockResolvedValue({
      id: 1,
      requestHash: 'other-hash',
      responseJson: null,
      createdAt: new Date(),
      completedAt: null,
    });

    await expect(
      provider.begin(1, 'key-1', hashCheckoutRequest(address)),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

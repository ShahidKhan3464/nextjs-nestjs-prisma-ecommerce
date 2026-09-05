import { BadRequestException } from '@nestjs/common';
import { CreateCheckoutProvider } from './create-checkout.provider';
import type { CreateCheckoutDto } from '../dto/create-checkout.dto';

const dto: CreateCheckoutDto = {
  shippingAddress: {
    fullName: 'Jane Doe',
    line1: '123 Market',
    city: 'NYC',
    region: 'NY',
    postalCode: '10001',
    country: 'US',
  },
};

describe('CreateCheckoutProvider idempotency', () => {
  const checkoutIdempotency = {
    hashRequest: jest.fn().mockReturnValue('hash'),
    begin: jest.fn(),
    complete: jest.fn(),
    abort: jest.fn(),
  };

  const provider = new CreateCheckoutProvider(
    {} as never,
    {} as never,
    checkoutIdempotency as never,
    {} as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    checkoutIdempotency.hashRequest.mockReturnValue('hash');
  });

  it('rejects checkout when neither header nor body key is present', async () => {
    await expect(provider.create(1, dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(checkoutIdempotency.begin).not.toHaveBeenCalled();
  });

  it('accepts an Idempotency-Key header', async () => {
    const stored = {
      clientSecret: 'sec',
      paymentIntentId: 'pi_1',
      checkoutSessionId: '9',
      orderIds: ['1'],
      preview: { tax: 0, total: 10, subtotal: 10 },
    };
    checkoutIdempotency.begin.mockResolvedValue(stored);

    await expect(provider.create(1, dto, 'header-key-1')).resolves.toEqual(
      stored,
    );
    expect(checkoutIdempotency.begin).toHaveBeenCalledWith(
      1,
      'header-key-1',
      'hash',
    );
  });

  it('accepts a body idempotencyKey', async () => {
    checkoutIdempotency.begin.mockResolvedValue('proceed');
    const createOnce = jest
      .spyOn(
        provider as unknown as { createOnce: () => Promise<unknown> },
        'createOnce',
      )
      .mockResolvedValue({ checkoutSessionId: '1' });

    await provider.create(2, { ...dto, idempotencyKey: 'body-key-99' });

    expect(checkoutIdempotency.begin).toHaveBeenCalledWith(
      2,
      'body-key-99',
      'hash',
    );
    expect(createOnce).toHaveBeenCalled();
    createOnce.mockRestore();
  });
});

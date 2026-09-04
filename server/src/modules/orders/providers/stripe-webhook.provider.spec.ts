import { StripeWebhookProvider } from './stripe-webhook.provider';
import { BadRequestException } from '@nestjs/common';

describe('StripeWebhookProvider', () => {
  const completeCheckoutProvider = { completeFromWebhook: jest.fn() };
  const handlePaymentFailed = { handle: jest.fn() };
  const stripeService = {
    webhookSecret: 'whsec_test',
    constructWebhookEvent: jest.fn(),
  };

  const provider = new StripeWebhookProvider(
    completeCheckoutProvider as never,
    handlePaymentFailed as never,
    stripeService as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    stripeService.webhookSecret = 'whsec_test';
  });

  it('rejects missing signatures', async () => {
    await expect(
      provider.handle(Buffer.from('{}'), undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects invalid signatures', async () => {
    stripeService.constructWebhookEvent.mockImplementation(() => {
      throw new Error('bad sig');
    });
    await expect(provider.handle(Buffer.from('{}'), 'sig')).rejects.toThrow(
      'Invalid Stripe webhook signature',
    );
  });

  it('completes checkout on payment_intent.succeeded', async () => {
    stripeService.constructWebhookEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_1' } },
    });
    completeCheckoutProvider.completeFromWebhook.mockResolvedValue({
      orders: [],
    });

    await expect(provider.handle(Buffer.from('{}'), 'sig')).resolves.toEqual({
      received: true,
    });
    expect(completeCheckoutProvider.completeFromWebhook).toHaveBeenCalledWith(
      'pi_1',
    );
  });

  it('is idempotent when completeFromWebhook succeeds twice', async () => {
    stripeService.constructWebhookEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_1' } },
    });
    completeCheckoutProvider.completeFromWebhook.mockResolvedValue({
      orders: [{ id: '1' }],
    });

    await provider.handle(Buffer.from('{}'), 'sig');
    await provider.handle(Buffer.from('{}'), 'sig');
    expect(completeCheckoutProvider.completeFromWebhook).toHaveBeenCalledTimes(
      2,
    );
  });

  it('handles payment_intent.payment_failed without completing checkout', async () => {
    stripeService.constructWebhookEvent.mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: { object: { id: 'pi_fail' } },
    });
    handlePaymentFailed.handle.mockResolvedValue(undefined);

    await expect(provider.handle(Buffer.from('{}'), 'sig')).resolves.toEqual({
      received: true,
    });
    expect(handlePaymentFailed.handle).toHaveBeenCalled();
    expect(completeCheckoutProvider.completeFromWebhook).not.toHaveBeenCalled();
  });
});

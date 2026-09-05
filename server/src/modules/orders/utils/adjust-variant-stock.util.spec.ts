import { BadRequestException } from '@nestjs/common';
import { adjustVariantStock } from './adjust-variant-stock.util';

describe('adjustVariantStock', () => {
  const tx = {
    $executeRaw: jest.fn(),
    productVariant: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('throws when reserving more than available stock', async () => {
    tx.productVariant.findMany.mockResolvedValue([
      { id: 1, sku: 'SKU-1', stockQuantity: 1 },
    ]);

    await expect(
      adjustVariantStock(
        tx as never,
        [{ variantId: 1, quantity: 2 }],
        'reserve',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.productVariant.update).not.toHaveBeenCalled();
  });

  it('decrements on reserve and increments on release', async () => {
    tx.productVariant.findMany.mockResolvedValue([
      { id: 2, sku: 'SKU-2', stockQuantity: 5 },
    ]);
    tx.productVariant.update.mockResolvedValue({});

    await adjustVariantStock(
      tx as never,
      [{ variantId: 2, quantity: 3 }],
      'reserve',
    );
    expect(tx.productVariant.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { stockQuantity: { decrement: 3 } },
    });

    tx.productVariant.update.mockClear();
    await adjustVariantStock(
      tx as never,
      [{ variantId: 2, quantity: 3 }],
      'release',
    );
    expect(tx.productVariant.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { stockQuantity: { increment: 3 } },
    });
  });
});

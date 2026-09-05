import { BadRequestException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { lockProductVariants } from './lock-product-variants.util';

export type StockLine = {
  variantId: number;
  quantity: number;
};

/**
 * Atomically reserve (decrement) or release (increment) stock for checkout lines.
 * Callers must already be inside a Prisma interactive transaction.
 */
export async function adjustVariantStock(
  tx: Prisma.TransactionClient,
  lines: StockLine[],
  direction: 'reserve' | 'release',
): Promise<void> {
  if (lines.length === 0) return;

  const qtyByVariant = new Map<number, number>();
  for (const line of lines) {
    if (line.quantity <= 0) {
      throw new BadRequestException('Invalid quantity');
    }
    qtyByVariant.set(
      line.variantId,
      (qtyByVariant.get(line.variantId) ?? 0) + line.quantity,
    );
  }

  const variantIds = [...qtyByVariant.keys()];
  await lockProductVariants(tx, variantIds);

  const variants = await tx.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, sku: true, stockQuantity: true },
  });
  const variantById = new Map(variants.map((v) => [v.id, v]));

  for (const [variantId, quantity] of qtyByVariant) {
    const variant = variantById.get(variantId);
    if (!variant) {
      throw new BadRequestException(`Variant not found for id ${variantId}`);
    }

    if (direction === 'reserve' && variant.stockQuantity < quantity) {
      throw new BadRequestException(`Insufficient stock for ${variant.sku}`);
    }

    await tx.productVariant.update({
      where: { id: variantId },
      data: {
        stockQuantity:
          direction === 'reserve'
            ? { decrement: quantity }
            : { increment: quantity },
      },
    });
  }
}

import { Prisma } from 'src/generated/prisma/client';

type TxClient = Prisma.TransactionClient;

/** Stable lock order — prevents deadlocks when two checkouts overlap. */
export function sortedVariantIds(variantIds: number[]): number[] {
  return [...new Set(variantIds)].sort((a, b) => a - b);
}

/** Row-lock variants in one round-trip before stock reads/writes. */
export async function lockProductVariants(
  tx: TxClient,
  variantIds: number[],
): Promise<void> {
  const uniqueIds = sortedVariantIds(variantIds);
  if (uniqueIds.length === 0) {
    return;
  }

  await tx.$executeRaw`
    SELECT id FROM product_variants
    WHERE id IN (${Prisma.join(uniqueIds)})
    FOR UPDATE
  `;
}

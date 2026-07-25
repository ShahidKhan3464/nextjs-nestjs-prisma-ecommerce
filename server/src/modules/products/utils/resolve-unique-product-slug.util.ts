import { PrismaService } from 'src/prisma/prisma.service';

type TxClient = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

/**
 * Resolves a globally unique product slug.
 * Soft-deleted products still occupy unique slug values at the DB level.
 */
export async function resolveUniqueProductSlug(
  db: PrismaService | TxClient,
  baseSlug: string,
  excludeProductId?: number,
): Promise<string> {
  const safeBase = baseSlug || 'product';
  let candidate = safeBase;
  let suffix = 0;

  while (true) {
    const existing = await db.product.findFirst({
      where: {
        slug: candidate,
        ...(excludeProductId !== undefined
          ? { NOT: { id: excludeProductId } }
          : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    suffix += 1;
    candidate = `${safeBase}-${suffix}`;
  }
}

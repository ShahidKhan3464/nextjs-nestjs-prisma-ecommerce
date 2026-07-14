import { PrismaService } from 'src/prisma/prisma.service';

type TxClient = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

/**
 * Resolves a globally unique store slug among non-deleted stores.
 * Optionally excludes a store id (useful when regenerating on update).
 */
export async function resolveUniqueStoreSlug(
  db: PrismaService | TxClient,
  baseSlug: string,
  excludeStoreId?: number,
): Promise<string> {
  let candidate = baseSlug;
  let suffix = 0;

  while (true) {
    const existing = await db.store.findFirst({
      where: {
        slug: candidate,
        deletedAt: null,
        ...(excludeStoreId !== undefined
          ? { NOT: { id: excludeStoreId } }
          : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

import { StoredFile } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export async function loadProductImagesMap(
  prisma: PrismaService,
  productIds: number[],
): Promise<Map<number, StoredFile[]>> {
  if (productIds.length === 0) {
    return new Map();
  }

  const productFiles = await prisma.productFile.findMany({
    where: { productId: { in: productIds } },
    orderBy: { sortOrder: 'asc' },
    include: { file: true },
  });

  const map = new Map<number, StoredFile[]>();
  for (const entry of productFiles) {
    const list = map.get(entry.productId) ?? [];
    list.push(entry.file);
    map.set(entry.productId, list);
  }
  return map;
}

export function attachProductImages<
  T extends { id: number; images?: StoredFile[] },
>(items: T[], imageMap: Map<number, StoredFile[]>): T[] {
  return items.map((item) => ({
    ...item,
    images: imageMap.get(item.id) ?? [],
  }));
}

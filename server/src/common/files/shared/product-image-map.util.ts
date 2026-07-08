import { StoredFile } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileOwnerModule } from 'src/common/enums/file-owner-module.enum';

export async function loadProductImagesMap(
  prisma: PrismaService,
  productIds: number[],
): Promise<Map<number, StoredFile[]>> {
  if (productIds.length === 0) {
    return new Map();
  }

  const files = await prisma.storedFile.findMany({
    where: {
      ownerModule: FileOwnerModule.PRODUCT,
      ownerId: { in: productIds },
    },
    orderBy: { sortOrder: 'asc' },
  });

  const map = new Map<number, StoredFile[]>();
  for (const file of files) {
    const list = map.get(file.ownerId) ?? [];
    list.push(file);
    map.set(file.ownerId, list);
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

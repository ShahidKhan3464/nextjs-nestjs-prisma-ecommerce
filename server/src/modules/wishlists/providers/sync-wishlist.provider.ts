import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SyncWishlistDto } from '../dto/sync-wishlist.dto';
import { ProductStatus } from 'src/common/enums/product-status.enum';

@Injectable()
export class SyncWishlistProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async sync(userId: number, dto: SyncWishlistDto): Promise<number[]> {
    const uniqueIds = [...new Set(dto.productIds)];
    const products =
      uniqueIds.length > 0
        ? await this.prisma.product.findMany({
            where: {
              id: { in: uniqueIds },
              deletedAt: null,
              status: ProductStatus.ACTIVE,
            },
            select: { id: true },
          })
        : [];
    const validIds = new Set(products.map((p) => p.id));

    const existing = await this.prisma.wishlistItem.findMany({
      where: { userId },
      select: { productId: true },
    });
    const existingIds = new Set(existing.map((e) => e.productId));

    const toCreate = uniqueIds
      .filter(
        (productId) => validIds.has(productId) && !existingIds.has(productId),
      )
      .map((productId) => ({ userId, productId }));

    if (toCreate.length > 0) {
      await this.prisma.wishlistItem.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }

    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { productId: true },
    });
    return items.map((i) => i.productId);
  }
}

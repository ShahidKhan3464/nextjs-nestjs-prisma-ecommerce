import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SyncWishlistDto } from '../dto/sync-wishlist.dto';

@Injectable()
export class SyncWishlistProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async sync(userId: number, dto: SyncWishlistDto): Promise<number[]> {
    const uniqueIds = [...new Set(dto.productIds)];
    const products =
      uniqueIds.length > 0
        ? await this.prisma.product.findMany({
            where: { id: { in: uniqueIds }, deletedAt: null },
          })
        : [];
    const validIds = new Set(products.map((p) => p.id));

    const existing = await this.prisma.wishlistItem.findMany({
      where: { userId },
    });
    const existingIds = new Set(existing.map((e) => e.productId));

    for (const productId of uniqueIds) {
      if (!validIds.has(productId) || existingIds.has(productId)) continue;
      await this.prisma.wishlistItem.create({
        data: { userId, productId },
      });
      existingIds.add(productId);
    }

    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((i) => i.productId);
  }
}

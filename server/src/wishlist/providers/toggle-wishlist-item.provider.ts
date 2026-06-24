import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ToggleWishlistItemProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async toggle(
    userId: number,
    productId: number,
  ): Promise<{ productIds: number[]; added: boolean }> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    let added = false;
    if (existing) {
      await this.prisma.wishlistItem.delete({
        where: { userId_productId: { userId, productId } },
      });
    } else {
      await this.prisma.wishlistItem.create({
        data: { userId, productId },
      });
      added = true;
    }

    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      productIds: items.map((i) => i.productId),
      added,
    };
  }
}

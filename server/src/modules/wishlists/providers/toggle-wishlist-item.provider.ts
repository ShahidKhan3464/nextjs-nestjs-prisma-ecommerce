import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ProductStatus } from 'src/common/enums/product-status.enum';

@Injectable()
export class ToggleWishlistItemProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async toggle(
    userId: number,
    productId: number,
  ): Promise<{ productIds: number[]; added: boolean }> {
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
      const product = await this.prisma.product.findFirst({
        where: {
          id: productId,
          deletedAt: null,
          status: ProductStatus.ACTIVE,
        },
      });
      if (!product) {
        throw new BadRequestException('Product not found');
      }

      await this.prisma.wishlistItem.create({
        data: { userId, productId },
      });
      added = true;
    }

    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { productId: true },
    });

    return {
      productIds: items.map((i) => i.productId),
      added,
    };
  }
}

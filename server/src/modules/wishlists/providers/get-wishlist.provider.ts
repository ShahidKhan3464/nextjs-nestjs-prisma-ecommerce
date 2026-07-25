import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class GetWishlistProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async findProductIds(userId: number): Promise<number[]> {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return items.map((i) => i.productId);
  }
}

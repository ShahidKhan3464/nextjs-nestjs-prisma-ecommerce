import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class RemoveCartItemProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async remove(userId: number, variantId: number): Promise<void> {
    const result = await this.prisma.cartItem.deleteMany({
      where: { userId, productVariantId: variantId },
    });
    if (!result.count) {
      throw new NotFoundException('Cart item not found');
    }
  }
}

import { Injectable } from '@nestjs/common';
import { SyncCartDto } from '../dto/sync-cart.dto';
import { GetCartProvider } from './get-cart.provider';
import { PrismaService } from 'src/prisma/prisma.service';
import type { CartItemResponse } from '../utils/map-cart-item.util';

@Injectable()
export class SyncCartProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly getCartProvider: GetCartProvider,
  ) {}

  public async sync(
    userId: number,
    dto: SyncCartDto,
  ): Promise<CartItemResponse[]> {
    const variantIds = [...new Set(dto.items.map((i) => i.variantId))];
    const variants =
      variantIds.length > 0
        ? await this.prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
          })
        : [];
    const variantById = new Map(variants.map((v) => [v.id, v]));

    const existing = await this.prisma.cartItem.findMany({ where: { userId } });
    const existingByVariant = new Map(
      existing.map((e) => [e.productVariantId, e]),
    );

    for (const line of dto.items) {
      const variant = variantById.get(line.variantId);
      if (!variant || variant.stockQuantity <= 0) continue;

      const qty = Math.min(line.quantity, variant.stockQuantity);
      const current = existingByVariant.get(line.variantId);

      if (current) {
        await this.prisma.cartItem.update({
          where: { id: current.id },
          data: { quantity: Math.max(current.quantity, qty) },
        });
      } else {
        const created = await this.prisma.cartItem.create({
          data: {
            userId,
            productVariantId: line.variantId,
            quantity: qty,
          },
        });
        existingByVariant.set(line.variantId, created);
      }
    }

    return this.getCartProvider.findByUser(userId);
  }
}

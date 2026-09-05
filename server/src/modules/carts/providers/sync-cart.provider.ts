import { Injectable } from '@nestjs/common';
import { SyncCartDto } from '../dto/sync-cart.dto';
import { GetCartProvider } from './get-cart.provider';
import { PrismaService } from 'src/prisma/prisma.service';
import type { CartItemResponse } from '../types/cart.types';
import { AVAILABLE_VARIANT_WHERE } from '../utils/available-variant.util';

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
            where: {
              id: { in: variantIds },
              ...AVAILABLE_VARIANT_WHERE,
            },
            select: {
              id: true,
              stockQuantity: true,
              product: {
                select: {
                  store: {
                    select: {
                      sellerProfile: { select: { userId: true } },
                    },
                  },
                },
              },
            },
          })
        : [];
    const variantById = new Map(
      variants
        .filter((v) => v.product.store?.sellerProfile?.userId !== userId)
        .map((v) => [v.id, v]),
    );

    const existing = await this.prisma.cartItem.findMany({
      where: { userId },
      select: { id: true, productVariantId: true, quantity: true },
    });
    const existingByVariant = new Map(
      existing.map((e) => [e.productVariantId, e]),
    );

    const toCreate: Array<{
      userId: number;
      productVariantId: number;
      quantity: number;
    }> = [];
    const toUpdate: Array<{ id: number; quantity: number }> = [];

    for (const line of dto.items) {
      const variant = variantById.get(line.variantId);
      if (!variant) continue;

      const qty = Math.min(line.quantity, variant.stockQuantity);
      if (qty <= 0) continue;

      const current = existingByVariant.get(line.variantId);
      if (current) {
        const nextQty = Math.max(current.quantity, qty);
        if (nextQty !== current.quantity) {
          toUpdate.push({ id: current.id, quantity: nextQty });
          current.quantity = nextQty;
        }
      } else {
        toCreate.push({
          userId,
          productVariantId: line.variantId,
          quantity: qty,
        });
        existingByVariant.set(line.variantId, {
          id: -1,
          productVariantId: line.variantId,
          quantity: qty,
        });
      }
    }

    if (toCreate.length > 0 || toUpdate.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        if (toCreate.length > 0) {
          await tx.cartItem.createMany({ data: toCreate });
        }
        await Promise.all(
          toUpdate.map((row) =>
            tx.cartItem.update({
              where: { id: row.id },
              data: { quantity: row.quantity },
            }),
          ),
        );
      });
    }

    return this.getCartProvider.findByUser(userId);
  }
}

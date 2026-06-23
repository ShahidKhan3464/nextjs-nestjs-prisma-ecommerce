import { Repository, In } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SyncCartDto } from '../dto/sync-cart.dto';
import { GetCartProvider } from './get-cart.provider';
import { CartItem } from '../entities/cart-item.entity';
import type { CartItemResponse } from '../utils/map-cart-item.util';
import { ProductVariant } from 'src/products/entities/product-variant.entity';

@Injectable()
export class SyncCartProvider {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    private readonly getCartProvider: GetCartProvider,
  ) {}

  public async sync(
    userId: number,
    dto: SyncCartDto,
  ): Promise<CartItemResponse[]> {
    const variantIds = [...new Set(dto.items.map((i) => i.variantId))];
    const variants =
      variantIds.length > 0
        ? await this.variantRepository.find({
            where: { id: In(variantIds) },
          })
        : [];
    const variantById = new Map(variants.map((v) => [v.id, v]));

    const existing = await this.cartRepository.find({ where: { userId } });
    const existingByVariant = new Map(
      existing.map((e) => [e.productVariantId, e]),
    );

    for (const line of dto.items) {
      const variant = variantById.get(line.variantId);
      if (!variant || variant.stock <= 0) continue;

      const qty = Math.min(line.quantity, variant.stock);
      const current = existingByVariant.get(line.variantId);

      if (current) {
        current.quantity = Math.max(current.quantity, qty);
        await this.cartRepository.save(current);
      } else {
        const created = this.cartRepository.create({
          userId,
          productVariantId: line.variantId,
          quantity: qty,
        });
        await this.cartRepository.save(created);
        existingByVariant.set(line.variantId, created);
      }
    }

    return this.getCartProvider.findByUser(userId);
  }
}

import { Repository, In } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SyncWishlistDto } from '../dto/sync-wishlist.dto';
import { Product } from 'src/products/entities/product.entity';
import { WishlistItem } from '../entities/wishlist-item.entity';

@Injectable()
export class SyncWishlistProvider {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistRepository: Repository<WishlistItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  public async sync(userId: number, dto: SyncWishlistDto): Promise<number[]> {
    const uniqueIds = [...new Set(dto.productIds)];
    const products =
      uniqueIds.length > 0
        ? await this.productRepository.find({
            where: { id: In(uniqueIds) },
          })
        : [];
    const validIds = new Set(products.map((p) => p.id));

    const existing = await this.wishlistRepository.find({ where: { userId } });
    const existingIds = new Set(existing.map((e) => e.productId));

    for (const productId of uniqueIds) {
      if (!validIds.has(productId) || existingIds.has(productId)) continue;
      await this.wishlistRepository.save(
        this.wishlistRepository.create({ userId, productId }),
      );
      existingIds.add(productId);
    }

    const items = await this.wishlistRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return items.map((i) => i.productId);
  }
}

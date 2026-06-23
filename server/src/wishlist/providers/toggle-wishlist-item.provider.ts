import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/product.entity';
import { WishlistItem } from '../entities/wishlist-item.entity';
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ToggleWishlistItemProvider {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistRepository: Repository<WishlistItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  public async toggle(
    userId: number,
    productId: number,
  ): Promise<{ productIds: number[]; added: boolean }> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    const existing = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    let added = false;
    if (existing) {
      await this.wishlistRepository.delete({ userId, productId });
    } else {
      await this.wishlistRepository.save(
        this.wishlistRepository.create({ userId, productId }),
      );
      added = true;
    }

    const items = await this.wishlistRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      productIds: items.map((i) => i.productId),
      added,
    };
  }
}

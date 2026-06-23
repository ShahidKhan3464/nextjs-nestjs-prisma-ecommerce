import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WishlistItem } from '../entities/wishlist-item.entity';

@Injectable()
export class GetWishlistProvider {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistRepository: Repository<WishlistItem>,
  ) {}

  public async findProductIds(userId: number): Promise<number[]> {
    const items = await this.wishlistRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return items.map((i) => i.productId);
  }
}

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from '../entities/cart-item.entity';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class RemoveCartItemProvider {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
  ) {}

  public async remove(userId: number, variantId: number): Promise<void> {
    const result = await this.cartRepository.delete({
      userId,
      productVariantId: variantId,
    });
    if (!result.affected) {
      throw new NotFoundException('Cart item not found');
    }
  }
}

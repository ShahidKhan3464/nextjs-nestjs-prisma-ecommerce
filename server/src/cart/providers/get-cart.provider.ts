import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from '../entities/cart-item.entity';
import { joinProductImages } from 'src/common/files/file-query.util';
import {
  CartItemResponse,
  mapCartItemToResponse,
} from '../utils/map-cart-item.util';

@Injectable()
export class GetCartProvider {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
  ) {}

  public async findByUser(userId: number): Promise<CartItemResponse[]> {
    const items = await joinProductImages(
      this.cartRepository
        .createQueryBuilder('cart')
        .where('cart.userId = :userId', { userId })
        .innerJoinAndSelect('cart.variant', 'variant')
        .innerJoinAndSelect('variant.product', 'product')
        .withDeleted()
        .addOrderBy('cart.createdAt', 'ASC'),
      'product',
    ).getMany();

    return items.map(mapCartItemToResponse);
  }
}

import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from '../entities/cart-item.entity';

@Injectable()
export class ClearCartProvider {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
  ) {}

  public async clear(userId: number): Promise<void> {
    await this.cartRepository.delete({ userId });
  }
}

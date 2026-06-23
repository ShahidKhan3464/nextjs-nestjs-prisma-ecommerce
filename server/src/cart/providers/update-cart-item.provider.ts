import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from '../entities/cart-item.entity';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { joinProductImages } from 'src/common/files/file-query.util';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CartItemResponse,
  mapCartItemToResponse,
} from '../utils/map-cart-item.util';

@Injectable()
export class UpdateCartItemProvider {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
  ) {}

  public async update(
    userId: number,
    variantId: number,
    dto: UpdateCartItemDto,
  ): Promise<CartItemResponse> {
    const item = await joinProductImages(
      this.cartRepository
        .createQueryBuilder('cart')
        .where('cart.userId = :userId', { userId })
        .andWhere('cart.productVariantId = :variantId', { variantId })
        .innerJoinAndSelect('cart.variant', 'variant')
        .innerJoinAndSelect('variant.product', 'product'),
      'product',
    ).getOne();

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity > item.variant.stock) {
      throw new BadRequestException('Insufficient stock');
    }

    item.quantity = dto.quantity;
    await this.cartRepository.save(item);

    return mapCartItemToResponse(item);
  }
}

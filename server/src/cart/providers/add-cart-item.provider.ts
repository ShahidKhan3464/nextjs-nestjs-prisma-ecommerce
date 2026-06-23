import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from '../entities/cart-item.entity';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { Injectable, BadRequestException } from '@nestjs/common';
import { joinProductImages } from 'src/common/files/file-query.util';
import { ProductVariant } from 'src/products/entities/product-variant.entity';
import {
  CartItemResponse,
  mapCartItemToResponse,
} from '../utils/map-cart-item.util';

@Injectable()
export class AddCartItemProvider {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
  ) {}

  public async add(
    userId: number,
    dto: AddCartItemDto,
  ): Promise<CartItemResponse> {
    const variant = await this.variantRepository.findOne({
      where: { id: dto.variantId },
      relations: ['product'],
    });

    if (!variant) {
      throw new BadRequestException('Product variant not found');
    }

    if (dto.quantity > variant.stock) {
      throw new BadRequestException('Insufficient stock');
    }

    let item = await this.cartRepository.findOne({
      where: { userId, productVariantId: dto.variantId },
    });

    if (item) {
      const nextQty = Math.min(item.quantity + dto.quantity, variant.stock);
      item.quantity = nextQty;
      await this.cartRepository.save(item);
    } else {
      item = this.cartRepository.create({
        userId,
        productVariantId: dto.variantId,
        quantity: dto.quantity,
      });
      await this.cartRepository.save(item);
    }

    const reloaded = await this.loadCartItem(userId, dto.variantId);
    if (!reloaded) {
      throw new BadRequestException('Failed to add cart item');
    }

    return mapCartItemToResponse(reloaded);
  }

  private loadCartItem(userId: number, variantId: number) {
    return joinProductImages(
      this.cartRepository
        .createQueryBuilder('cart')
        .where('cart.userId = :userId', { userId })
        .andWhere('cart.productVariantId = :variantId', { variantId })
        .innerJoinAndSelect('cart.variant', 'variant')
        .innerJoinAndSelect('variant.product', 'product'),
      'product',
    ).getOne();
  }
}

import { PrismaService } from 'src/prisma/prisma.service';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { Injectable, BadRequestException } from '@nestjs/common';
import { findCartItemsWithImages } from 'src/common/prisma/file-query.util';
import {
  AVAILABLE_VARIANT_INCLUDE,
  assertVariantAvailable,
} from '../utils/available-variant.util';
import {
  CartItemResponse,
  mapCartItemToResponse,
} from '../utils/map-cart-item.util';

@Injectable()
export class AddCartItemProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async add(
    userId: number,
    dto: AddCartItemDto,
  ): Promise<CartItemResponse> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
      include: AVAILABLE_VARIANT_INCLUDE,
    });

    if (!variant) {
      throw new BadRequestException('Product variant not found');
    }

    assertVariantAvailable(variant);

    if (dto.quantity > variant.stockQuantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: {
        userId_productVariantId: {
          userId,
          productVariantId: dto.variantId,
        },
      },
    });

    if (existing) {
      const nextQty = Math.min(
        existing.quantity + dto.quantity,
        variant.stockQuantity,
      );
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          userId,
          productVariantId: dto.variantId,
          quantity: dto.quantity,
        },
      });
    }

    const reloaded = await findCartItemsWithImages(this.prisma, {
      userId,
      productVariantId: dto.variantId,
    });
    const item = reloaded[0];
    if (!item) {
      throw new BadRequestException('Failed to add cart item');
    }

    return mapCartItemToResponse(item);
  }
}

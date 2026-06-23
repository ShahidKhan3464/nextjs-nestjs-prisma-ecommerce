import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { findCartItemsWithImages } from 'src/common/files/file-query.util';
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
  constructor(private readonly prisma: PrismaService) {}

  public async update(
    userId: number,
    variantId: number,
    dto: UpdateCartItemDto,
  ): Promise<CartItemResponse> {
    const items = await findCartItemsWithImages(this.prisma, {
      userId,
      productVariantId: variantId,
    });
    const item = items[0];

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity > item.variant.stock) {
      throw new BadRequestException('Insufficient stock');
    }

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: dto.quantity },
    });

    item.quantity = dto.quantity;
    return mapCartItemToResponse(item);
  }
}

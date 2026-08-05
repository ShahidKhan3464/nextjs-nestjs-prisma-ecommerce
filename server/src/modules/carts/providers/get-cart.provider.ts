import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { CartItemResponse } from '../types/cart.types';
import { mapCartItemToResponse } from '../utils/map-cart-item.util';
import { findCartItemsWithImages } from 'src/common/prisma/file-query.util';

@Injectable()
export class GetCartProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async findByUser(userId: number): Promise<CartItemResponse[]> {
    const items = await findCartItemsWithImages(
      this.prisma,
      { userId },
      { createdAt: 'asc' },
    );

    return items.map(mapCartItemToResponse);
  }
}

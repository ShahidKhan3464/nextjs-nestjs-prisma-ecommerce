import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { findCartItemsWithImages } from 'src/common/prisma/file-query.util';
import {
  CartItemResponse,
  mapCartItemToResponse,
} from '../utils/map-cart-item.util';

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

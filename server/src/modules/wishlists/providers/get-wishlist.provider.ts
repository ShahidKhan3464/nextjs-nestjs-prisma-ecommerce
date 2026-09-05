import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { WishlistResponse } from '../types/wishlist.types';
import { ProductStatus } from 'src/common/enums/product-status.enum';
import { mapWishlistProductToSummary } from '../utils/map-wishlist.util';
import { StoreFileType } from 'src/modules/stores/constants/store.constants';

@Injectable()
export class GetWishlistProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async findForUser(userId: number): Promise<WishlistResponse> {
    const wishlistRows = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        productId: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            basePrice: true,
            status: true,
            deletedAt: true,
            variants: {
              select: { stockQuantity: true },
            },
            files: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
              select: { file: { select: { urlPath: true } } },
            },
            store: {
              select: {
                id: true,
                name: true,
                slug: true,
                verifiedAt: true,
                files: {
                  where: { type: StoreFileType.LOGO },
                  orderBy: { sortOrder: 'asc' },
                  take: 1,
                  select: { file: { select: { urlPath: true } } },
                },
                sellerProfile: {
                  select: { businessName: true },
                },
              },
            },
          },
        },
      },
    });

    const productIds = wishlistRows.map((row) => String(row.productId));

    const items = wishlistRows
      .filter(
        (row) =>
          row.product &&
          row.product.deletedAt === null &&
          row.product.status === ProductStatus.ACTIVE,
      )
      .map((row) => mapWishlistProductToSummary(row.product));

    return { productIds, items };
  }
}

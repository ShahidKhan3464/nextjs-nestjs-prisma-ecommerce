import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductStatus } from 'src/common/enums/product-status.enum';

export type WishlistAvailability =
  | 'in_stock'
  | 'low_stock'
  | 'out_of_stock';

export type WishlistProductStore = {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  logoUrl: string | null;
  sellerName: string;
};

export type WishlistProductSummary = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  basePrice: number;
  availability: WishlistAvailability;
  totalStock: number;
  store: WishlistProductStore | null;
};

export type WishlistResponse = {
  productIds: string[];
  items: WishlistProductSummary[];
};

const LOW_STOCK_THRESHOLD = 5;

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
                  where: { type: 'LOGO' },
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

    const items: WishlistProductSummary[] = wishlistRows
      .filter(
        (row) =>
          row.product &&
          row.product.deletedAt === null &&
          row.product.status === ProductStatus.ACTIVE,
      )
      .map((row) => {
        const product = row.product;
        const totalStock = (product.variants ?? []).reduce(
          (sum, v) => sum + (v.stockQuantity ?? 0),
          0,
        );
        let availability: WishlistAvailability = 'in_stock';
        if (totalStock <= 0) availability = 'out_of_stock';
        else if (totalStock <= LOW_STOCK_THRESHOLD) availability = 'low_stock';

        const galleryFallback = product.files?.[0]?.file?.urlPath ?? null;

        return {
          id: String(product.id),
          name: product.name,
          slug: product.slug ?? String(product.id),
          image: galleryFallback,
          basePrice: Number(product.basePrice),
          availability,
          totalStock,
          store: product.store
            ? {
                id: String(product.store.id),
                name: product.store.name,
                slug: product.store.slug,
                verified: Boolean(product.store.verifiedAt),
                logoUrl: product.store.files?.[0]?.file?.urlPath ?? null,
                sellerName:
                  product.store.sellerProfile?.businessName ??
                  product.store.name,
              }
            : null,
        };
      });

    return { productIds, items };
  }

  /** Used by sync/toggle callers that still need only IDs. */
  public async findProductIds(userId: number): Promise<number[]> {
    const items = await this.prisma.wishlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { productId: true },
    });
    return items.map((i) => i.productId);
  }
}

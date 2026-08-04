import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  getProductReviewStats,
  getStoreReviewStats,
} from '../utils/review-stats.util';

@Injectable()
export class GetReviewSummaryProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getProductSummary(productId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const stats = await getProductReviewStats(this.prisma, productId);
    return {
      productId: String(productId),
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      distribution: stats.distribution,
    };
  }

  async getStoreReputation(storeId: number) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      select: { id: true, verifiedAt: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const stats = await getStoreReviewStats(this.prisma, storeId);
    return {
      storeId: String(storeId),
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
      productsSold: stats.productsSold,
      verified: store.verifiedAt != null,
    };
  }
}

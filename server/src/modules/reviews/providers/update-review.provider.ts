import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { syncProductReviewStats } from '../utils/review-stats.util';
import { ReviewOwnershipProvider } from './review-ownership.provider';
import { mapReviewToResponse, ReviewResponse } from '../utils/map-review.util';
import {
  reviewListInclude,
  findReviewWithRelations,
} from '../utils/review-query.util';

@Injectable()
export class UpdateReviewProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewOwnershipProvider: ReviewOwnershipProvider,
  ) {}

  public async update(
    reviewId: number,
    userId: number,
    dto: UpdateReviewDto,
  ): Promise<ReviewResponse> {
    const review = await findReviewWithRelations(this.prisma, { id: reviewId });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    this.reviewOwnershipProvider.assertCanUpdate(review, userId);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM products WHERE id = ${review.productId} FOR UPDATE
      `;

      const saved = await tx.review.update({
        where: { id: reviewId },
        data: {
          ...(dto.rating !== undefined && { rating: dto.rating }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.comment !== undefined && { comment: dto.comment }),
        },
        include: reviewListInclude,
      });

      if (dto.rating !== undefined) {
        await syncProductReviewStats(tx, review.productId);
      }

      return saved;
    });

    return mapReviewToResponse(updated, { includeProduct: true });
  }
}

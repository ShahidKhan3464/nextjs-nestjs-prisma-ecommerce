import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { Injectable, ConflictException } from '@nestjs/common';
import { reviewListInclude } from '../utils/review-query.util';
import { syncProductReviewStats } from '../utils/review-stats.util';
import { ReviewEligibilityProvider } from './review-eligibility.provider';
import { mapReviewToResponse, ReviewResponse } from '../utils/map-review.util';

@Injectable()
export class CreateReviewProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewEligibilityProvider: ReviewEligibilityProvider,
  ) {}

  public async create(
    userId: number,
    dto: CreateReviewDto,
  ): Promise<ReviewResponse> {
    await this.reviewEligibilityProvider.assertProductReviewable(dto.productId);
    await this.reviewEligibilityProvider.assertBuyerEligibleToReview(
      userId,
      dto.productId,
    );

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`
          SELECT id FROM products WHERE id = ${dto.productId} FOR UPDATE
        `;

        const createdReview = await tx.review.create({
          data: {
            userId,
            productId: dto.productId,
            rating: dto.rating,
            title: dto.title,
            comment: dto.comment,
          },
          include: reviewListInclude,
        });

        await syncProductReviewStats(tx, dto.productId);
        return createdReview;
      });

      return mapReviewToResponse(created, { includeProduct: true });
    } catch (err) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'You have already reviewed this product. Update your existing review instead.',
        );
      }
      throw err;
    }
  }
}

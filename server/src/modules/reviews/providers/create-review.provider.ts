import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { reviewListInclude } from '../utils/review-query.util';
import { mapReviewToResponse, ReviewResponse } from '../utils/map-review.util';
import { ReviewEligibilityProvider } from './review-eligibility.provider';

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

    const existing = await this.prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: dto.productId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        'You have already reviewed this product. Update your existing review instead.',
      );
    }

    const created = await this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
      },
      include: reviewListInclude,
    });

    return mapReviewToResponse(created, { includeProduct: true });
  }
}

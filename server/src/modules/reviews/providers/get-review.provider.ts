import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { findReviewWithRelations } from '../utils/review-query.util';
import { mapReviewToResponse, ReviewResponse } from '../utils/map-review.util';

@Injectable()
export class GetReviewProvider {
  constructor(private readonly prisma: PrismaService) {}

  /** Any authenticated user may view a review (public marketplace content). */
  public async findOne(reviewId: number): Promise<ReviewResponse> {
    const review = await findReviewWithRelations(this.prisma, { id: reviewId });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return mapReviewToResponse(review, { includeProduct: true });
  }
}

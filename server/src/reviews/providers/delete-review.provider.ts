import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Injectable, NotFoundException } from '@nestjs/common';
import { findReviewWithRelations } from '../utils/review-query.util';
import { ReviewOwnershipProvider } from './review-ownership.provider';

@Injectable()
export class DeleteReviewProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewOwnershipProvider: ReviewOwnershipProvider,
  ) {}

  public async delete(
    reviewId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<void> {
    const review = await findReviewWithRelations(this.prisma, { id: reviewId });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    this.reviewOwnershipProvider.assertCanDelete(review, userId, roles);

    await this.prisma.review.delete({
      where: { id: reviewId },
    });
  }
}

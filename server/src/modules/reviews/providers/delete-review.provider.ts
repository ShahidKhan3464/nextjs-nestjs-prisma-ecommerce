import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Injectable, NotFoundException } from '@nestjs/common';
import { syncProductReviewStats } from '../utils/review-stats.util';
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

    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM products WHERE id = ${review.productId} FOR UPDATE
      `;
      await tx.review.delete({
        where: { id: reviewId },
      });
      await syncProductReviewStats(tx, review.productId);
    });
  }
}

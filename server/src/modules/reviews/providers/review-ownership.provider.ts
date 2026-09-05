import { ReviewRow } from '../utils/map-review.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { isSuperAdmin } from 'src/common/utils/authorization.util';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class ReviewOwnershipProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async findOwnedStoreOrThrow(userId: number) {
    const store = await this.prisma.store.findFirst({
      where: {
        deletedAt: null,
        sellerProfile: { userId, deletedAt: null },
      },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found for this seller');
    }

    return store;
  }

  /** Only the review author may update review content. */
  public assertCanUpdate(review: ReviewRow, userId: number): void {
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }
  }

  /**
   * Buyer may delete own review; SUPER_ADMIN may remove any review (moderation).
   * Sellers cannot delete buyer reviews.
   */
  public assertCanDelete(
    review: ReviewRow,
    userId: number,
    roles: UserRole[],
  ): void {
    if (isSuperAdmin(roles)) {
      return;
    }

    if (review.userId === userId) {
      return;
    }

    throw new ForbiddenException(
      'You do not have permission to delete this review',
    );
  }
}

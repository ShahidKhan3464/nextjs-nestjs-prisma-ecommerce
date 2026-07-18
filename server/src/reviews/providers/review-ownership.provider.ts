import { ReviewRow } from '../utils/map-review.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { isSuperAdmin, hasAnyRole } from 'src/common/utils/authorization.util';
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

  public async findOwnedStoreId(userId: number): Promise<number | null> {
    const store = await this.prisma.store.findFirst({
      where: {
        deletedAt: null,
        sellerProfile: { userId, deletedAt: null },
      },
      select: { id: true },
    });
    return store?.id ?? null;
  }

  /**
   * Buyer may view own reviews; seller may view reviews on their store products;
   * SUPER_ADMIN may view any review. Product-scoped public lists bypass this.
   */
  public assertCanView(
    review: ReviewRow,
    userId: number,
    roles: UserRole[],
    ownedStoreId?: number | null,
  ): void {
    if (isSuperAdmin(roles)) {
      return;
    }

    if (review.userId === userId) {
      return;
    }

    if (
      hasAnyRole(roles, [UserRole.SELLER]) &&
      ownedStoreId !== undefined &&
      ownedStoreId !== null &&
      review.product?.storeId === ownedStoreId
    ) {
      return;
    }

    throw new ForbiddenException('You do not have access to this review');
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

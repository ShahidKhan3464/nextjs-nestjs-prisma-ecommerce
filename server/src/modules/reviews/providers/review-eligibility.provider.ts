import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '../constants/review.constants';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ReviewEligibilityProvider {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Product must exist and not be soft-deleted before a new review can be created.
   */
  public async assertProductReviewable(productId: number): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }
  }

  /**
   * Sellers cannot review products belonging to their own store.
   */
  public async assertNotOwnProduct(
    userId: number,
    productId: number,
  ): Promise<void> {
    const ownProduct = await this.prisma.product.findFirst({
      where: {
        id: productId,
        deletedAt: null,
        store: {
          deletedAt: null,
          sellerProfile: { userId, deletedAt: null },
        },
      },
      select: { id: true },
    });

    if (ownProduct) {
      throw new BadRequestException('You cannot review your own products');
    }
  }

  /**
   * Buyer may review only if they purchased the product on a delivered order
   * with a successfully completed payment. Verified via Prisma relations —
   * never trusts client-provided order/payment ids.
   */
  public async assertBuyerEligibleToReview(
    userId: number,
    productId: number,
  ): Promise<void> {
    await this.assertNotOwnProduct(userId, productId);

    const eligiblePurchase = await this.prisma.order.findFirst({
      where: {
        userId,
        status: OrderStatus.DELIVERED,
        payment: {
          status: PaymentStatus.SUCCEEDED,
        },
        items: {
          some: {
            variant: {
              productId,
            },
          },
        },
      },
      select: {
        id: true,
        status: true,
        payment: {
          select: { status: true },
        },
      },
    });

    if (eligiblePurchase) {
      return;
    }

    const anyPurchase = await this.prisma.order.findFirst({
      where: {
        userId,
        items: {
          some: {
            variant: { productId },
          },
        },
      },
      select: {
        id: true,
        status: true,
        payment: { select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!anyPurchase) {
      throw new BadRequestException(
        'You can only review products you have purchased',
      );
    }

    if (anyPurchase.payment?.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException(
        'Payment must be completed before you can review this product',
      );
    }

    if (anyPurchase.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Order must be delivered before you can review this product',
      );
    }

    throw new BadRequestException(
      'You are not eligible to review this product',
    );
  }
}

import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { GetReviewProvider } from './providers/get-review.provider';
import { GetReviewsProvider } from './providers/get-reviews.provider';
import { CreateReviewProvider } from './providers/create-review.provider';
import { UpdateReviewProvider } from './providers/update-review.provider';
import { DeleteReviewProvider } from './providers/delete-review.provider';
import { ReviewOwnershipProvider } from './providers/review-ownership.provider';
import { GetReviewSummaryProvider } from './providers/get-review-summary.provider';
import { ReviewEligibilityProvider } from './providers/review-eligibility.provider';

@Module({
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    GetReviewProvider,
    GetReviewsProvider,
    CreateReviewProvider,
    UpdateReviewProvider,
    DeleteReviewProvider,
    ReviewOwnershipProvider,
    GetReviewSummaryProvider,
    ReviewEligibilityProvider,
  ],
  exports: [ReviewsService],
})
export class ReviewsModule {}

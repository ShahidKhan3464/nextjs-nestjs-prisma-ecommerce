import { Injectable } from '@nestjs/common';
import { QueryReviewDto } from './dto/query-review.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { GetReviewProvider } from './providers/get-review.provider';
import { GetReviewsProvider } from './providers/get-reviews.provider';
import { CreateReviewProvider } from './providers/create-review.provider';
import { UpdateReviewProvider } from './providers/update-review.provider';
import { DeleteReviewProvider } from './providers/delete-review.provider';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly getReviewProvider: GetReviewProvider,
    private readonly getReviewsProvider: GetReviewsProvider,
    private readonly createReviewProvider: CreateReviewProvider,
    private readonly updateReviewProvider: UpdateReviewProvider,
    private readonly deleteReviewProvider: DeleteReviewProvider,
  ) {}

  findByProduct(productId: number, query: QueryReviewDto) {
    return this.getReviewsProvider.findByProduct(productId, query);
  }

  findMine(userId: number, query: QueryReviewDto) {
    return this.getReviewsProvider.findByUser(userId, query);
  }

  findSellerReviews(userId: number, query: QueryReviewDto) {
    return this.getReviewsProvider.findBySeller(userId, query);
  }

  findAllAdmin(query: QueryReviewDto) {
    return this.getReviewsProvider.findAll(query);
  }

  findOne(reviewId: number) {
    return this.getReviewProvider.findOne(reviewId);
  }

  create(userId: number, dto: CreateReviewDto) {
    return this.createReviewProvider.create(userId, dto);
  }

  update(reviewId: number, userId: number, dto: UpdateReviewDto) {
    return this.updateReviewProvider.update(reviewId, userId, dto);
  }

  remove(reviewId: number, userId: number, roles: UserRole[]) {
    return this.deleteReviewProvider.delete(reviewId, userId, roles);
  }
}

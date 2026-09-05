import { ReviewsService } from './reviews.service';
import { QueryReviewDto } from './dto/query-review.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ReviewResponseDto } from './dto/review-response.dto';
import { Auth } from 'src/modules/auth/decorators/auth.decorator';
import { AuthType } from 'src/modules/auth/constants/auth.constants';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import {
  ReviewSummaryResponseDto,
  StoreReputationResponseDto,
} from './dto/review-summary-response.dto';
import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('product/:productId/summary')
  @Auth(AuthType.NONE)
  @ApiOperation({ summary: 'Average rating and distribution for a product' })
  @ApiOkResponse({ type: ReviewSummaryResponseDto })
  productSummary(@Param('productId', ParseIntPipe) productId: number) {
    return this.reviewsService.getProductSummary(productId);
  }

  @Get('product/:productId')
  @Auth(AuthType.NONE)
  @ApiOperation({ summary: 'List reviews for a product' })
  @ApiOkResponse({ type: ReviewResponseDto, isArray: true })
  findByProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: QueryReviewDto,
  ) {
    return this.reviewsService.findByProduct(productId, query);
  }

  @Get('store/:storeId/reputation')
  @Auth(AuthType.NONE)
  @ApiOperation({ summary: 'Store reputation stats (rating, sold, verified)' })
  @ApiOkResponse({ type: StoreReputationResponseDto })
  storeReputation(@Param('storeId', ParseIntPipe) storeId: number) {
    return this.reviewsService.getStoreReputation(storeId);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List reviews written by the authenticated buyer' })
  findMine(@ActiveUser() userId: number, @Query() query: QueryReviewDto) {
    return this.reviewsService.findMine(userId, query);
  }

  @Get('seller')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: 'List reviews for products belonging to the seller store',
  })
  findSellerReviews(
    @ActiveUser() userId: number,
    @Query() query: QueryReviewDto,
  ) {
    return this.reviewsService.findSellerReviews(userId, query);
  }

  @Get('admin/all')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all reviews with filters (admin)' })
  findAllAdmin(@Query() query: QueryReviewDto) {
    return this.reviewsService.findAllAdmin(query);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a review by id' })
  @ApiOkResponse({ type: ReviewResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Create a review for a purchased, delivered product (one per product)',
  })
  @ApiOkResponse({ type: ReviewResponseDto })
  create(@ActiveUser() userId: number, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update your own review' })
  @ApiOkResponse({ type: ReviewResponseDto })
  update(
    @ActiveUser() userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Delete your own review, or remove any review as admin (moderation)',
  })
  remove(
    @ActiveUser() userId: number,
    @ActiveUser('roles') roles: UserRole[],
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.reviewsService.remove(id, userId, roles);
  }
}

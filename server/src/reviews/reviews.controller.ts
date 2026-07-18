import { ReviewsService } from './reviews.service';
import { QueryReviewDto } from './dto/query-review.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
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
@ApiBearerAuth('access-token')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('product/:productId')
  @ApiOperation({ summary: 'List reviews for a product' })
  @ApiOkResponse({ type: ReviewResponseDto, isArray: true })
  findByProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: QueryReviewDto,
  ) {
    return this.reviewsService.findByProduct(productId, query);
  }

  @Get('me')
  @ApiOperation({ summary: 'List reviews written by the authenticated buyer' })
  findMine(@ActiveUser() userId: number, @Query() query: QueryReviewDto) {
    return this.reviewsService.findMine(userId, query);
  }

  @Get('seller')
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
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all reviews with filters (admin)' })
  findAllAdmin(@Query() query: QueryReviewDto) {
    return this.reviewsService.findAllAdmin(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by id' })
  @ApiOkResponse({ type: ReviewResponseDto })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary:
      'Create a review for a purchased, delivered product (one per product)',
  })
  @ApiOkResponse({ type: ReviewResponseDto })
  create(@ActiveUser() userId: number, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @Patch(':id')
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

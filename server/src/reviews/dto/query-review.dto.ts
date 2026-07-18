import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Min, IsInt, IsOptional, Max } from 'class-validator';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import {
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
} from '../constants/review.constants';

export class QueryReviewDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by product id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId?: number;

  @ApiPropertyOptional({
    description: 'Filter by store id (admin only)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  storeId?: number;

  @ApiPropertyOptional({
    description: 'Filter by buyer user id (admin only)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({
    description: 'Filter by exact rating',
    minimum: REVIEW_RATING_MIN,
    maximum: REVIEW_RATING_MAX,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(REVIEW_RATING_MIN)
  @Max(REVIEW_RATING_MAX)
  rating?: number;
}

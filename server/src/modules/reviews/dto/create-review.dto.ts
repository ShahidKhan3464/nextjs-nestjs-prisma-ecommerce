import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
} from '../constants/review.constants';
import {
  Max,
  Min,
  IsInt,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Product to review', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

  @ApiProperty({
    description: 'Star rating',
    minimum: REVIEW_RATING_MIN,
    maximum: REVIEW_RATING_MAX,
    example: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(REVIEW_RATING_MIN)
  @Max(REVIEW_RATING_MAX)
  rating: number;

  @ApiPropertyOptional({
    description: 'Optional review title',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    description: 'Optional review body',
    minLength: 10,
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  comment?: string;
}

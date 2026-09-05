import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
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
  ValidateIf,
} from 'class-validator';

export class UpdateReviewDto {
  @ApiPropertyOptional({
    description: 'Star rating',
    minimum: REVIEW_RATING_MIN,
    maximum: REVIEW_RATING_MAX,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(REVIEW_RATING_MIN)
  @Max(REVIEW_RATING_MAX)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Review title (omit to leave unchanged; null clears)',
    maxLength: 255,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title?: string | null;

  @ApiPropertyOptional({
    description: 'Review body (omit to leave unchanged; null clears)',
    minLength: 10,
    maxLength: 2000,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  comment?: string | null;
}

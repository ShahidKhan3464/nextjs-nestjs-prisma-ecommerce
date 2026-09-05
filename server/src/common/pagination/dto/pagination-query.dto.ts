import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_MAX_LIMIT,
} from '../constants/pagination.constants';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'The page number',
    example: PAGINATION_DEFAULT_PAGE,
    minimum: 1,
    default: PAGINATION_DEFAULT_PAGE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = PAGINATION_DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: 'The number of items to return',
    example: PAGINATION_DEFAULT_LIMIT,
    minimum: 1,
    maximum: PAGINATION_MAX_LIMIT,
    default: PAGINATION_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION_MAX_LIMIT)
  limit: number = PAGINATION_DEFAULT_LIMIT;
}

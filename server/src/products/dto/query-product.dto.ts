import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../constants/product.constants';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import {
  Min,
  IsIn,
  IsInt,
  IsEnum,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class QueryProductDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Filter by store id (admin / catalog)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  storeId?: number;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    enum: ['active', 'removed', 'all'],
    default: 'active',
  })
  @IsOptional()
  @IsIn(['active', 'removed', 'all'])
  lifeCycle?: 'active' | 'removed' | 'all' = 'active';

  @ApiPropertyOptional({
    description: 'Search in product name and description (case-insensitive)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by minimum price' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum price' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;
}

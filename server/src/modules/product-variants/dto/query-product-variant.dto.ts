import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import {
  Min,
  IsInt,
  IsNumber,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class QueryProductVariantDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by product id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId?: number;

  @ApiPropertyOptional({ description: 'Filter by store id (admin / catalog)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  storeId?: number;

  @ApiPropertyOptional({ description: 'Exact SKU match' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sku?: string;

  @ApiPropertyOptional({ description: 'Filter by color (case-insensitive)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  color?: string;

  @ApiPropertyOptional({ description: 'Filter by size (case-insensitive)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  size?: string;

  @ApiPropertyOptional({
    description: 'Search in SKU, color, and size (case-insensitive)',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @ApiPropertyOptional({ description: 'Minimum stockQuantity' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ description: 'Maximum stockQuantity' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxStock?: number;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}

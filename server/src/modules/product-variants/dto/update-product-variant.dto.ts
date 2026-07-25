import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  Min,
  IsInt,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class UpdateProductVariantDto {
  @ApiPropertyOptional({ example: 'M' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  size?: string;

  @ApiPropertyOptional({ example: 'Black' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  color?: string;

  @ApiPropertyOptional({ example: 'SKU-001' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  sku?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Available stock (must be >= 0)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({
    example: 99.99,
    description: 'Variant price (may differ from product basePrice)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;
}

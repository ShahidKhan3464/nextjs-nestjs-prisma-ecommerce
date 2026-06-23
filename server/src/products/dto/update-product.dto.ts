import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../constants/product.constants';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { CreateProductVariantDto } from './create-product-variant.dto';
import { UniqueVariantSkuConstraint } from '../validators/unique-variant-sku.validator';
import {
  Min,
  IsEnum,
  IsArray,
  IsNumber,
  Validate,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null
      ? undefined
      : Number(value),
  )
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ type: [CreateProductVariantDto] })
  @IsOptional()
  @Transform(({ value }): CreateProductVariantDto[] => {
    if (typeof value !== 'string') return value;
    try {
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];
      return plainToInstance(CreateProductVariantDto, parsed);
    } catch {
      return [];
    }
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  @Validate(UniqueVariantSkuConstraint)
  variants?: CreateProductVariantDto[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Image urlPath values to keep; omit to leave images unchanged',
  })
  @IsOptional()
  @Transform(({ value }): string[] | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(String) : undefined;
      } catch {
        return undefined;
      }
    }
    if (Array.isArray(value)) return value.map(String);
    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  retainImagePaths?: string[];
}

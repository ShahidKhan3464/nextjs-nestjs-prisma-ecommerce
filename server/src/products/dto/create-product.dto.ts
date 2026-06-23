import { ProductStatus } from '../constants/product.constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  IsNotEmpty,
  IsOptional,
  ValidateIf,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @Transform(({ value }) => (value === '' ? undefined : Number(value)))
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  categoryId: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @ValidateIf(
    (_, v) => v !== undefined && v !== null && String(v).trim() !== '',
  )
  @MinLength(10)
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty({
    type: [CreateProductVariantDto],
  })
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
  variants: CreateProductVariantDto[];

  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Product images',
  })
  @IsOptional()
  images?: any[];
}

import { ProductStatus } from '../constants/product.constants';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { CreateProductVariantDto } from './create-product-variant.dto';
import { UniqueVariantSkuConstraint } from '../validators/unique-variant-sku.validator';
import {
  Min,
  IsIn,
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

  @ApiPropertyOptional({
    description:
      'Required for SUPER_ADMIN. Ignored for sellers — store is resolved from the authenticated seller.',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === undefined || value === null
      ? undefined
      : Number(value),
  )
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  storeId?: number;

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

  @ApiPropertyOptional({
    enum: [ProductStatus.DRAFT, ProductStatus.ACTIVE],
    default: ProductStatus.DRAFT,
    description:
      'Defaults to DRAFT. Use Publish endpoint to go DRAFT → ACTIVE.',
  })
  @IsOptional()
  @IsIn([ProductStatus.DRAFT, ProductStatus.ACTIVE])
  status?: ProductStatus;

  @ApiProperty({
    type: [CreateProductVariantDto],
  })
  @Transform(({ value }): CreateProductVariantDto[] => {
    if (typeof value !== 'string') return value;

    try {
      const parsed: unknown = JSON.parse(value);

      if (!Array.isArray(parsed)) {
        return value as unknown as CreateProductVariantDto[];
      }

      return plainToInstance(CreateProductVariantDto, parsed);
    } catch {
      return value as unknown as CreateProductVariantDto[];
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

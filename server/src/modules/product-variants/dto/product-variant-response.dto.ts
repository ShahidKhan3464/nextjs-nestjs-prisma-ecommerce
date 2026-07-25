import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from 'src/common/enums/product-status.enum';

export class ProductVariantStoreSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  status: string;
}

/** Nested product summary on variant responses (when included). */
export class ProductVariantProductSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  slug: string | null;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;

  @ApiProperty()
  storeId: number;

  @ApiProperty()
  categoryId: number;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  basePrice: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty({ nullable: true })
  publishedAt: Date | null;

  @ApiPropertyOptional({ type: ProductVariantStoreSummaryDto })
  store?: ProductVariantStoreSummaryDto;
}

/** Mirrors `mapProductVariantToResponse`. */
export class ProductVariantResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  size: string;

  @ApiProperty()
  color: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  productId: number;

  @ApiProperty()
  stockQuantity: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: ProductVariantProductSummaryDto })
  product?: ProductVariantProductSummaryDto;
}

export class PaginatedProductVariantResponseDto {
  @ApiProperty({ type: [ProductVariantResponseDto] })
  data: ProductVariantResponseDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;
}

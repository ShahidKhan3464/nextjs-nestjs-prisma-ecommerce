import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../constants/product.constants';

/** Nested store summary as returned on product payloads. */
export class ProductStoreSummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional({ nullable: true })
  deletedAt?: Date | null;
}

/** Nested category as returned on product payloads (Prisma Category fields). */
export class ProductCategorySummaryDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  deletedAt: Date | null;
}

/**
 * Image file fields selected for product responses (`PRODUCT_FILE_SELECT`).
 * Not the full StoredFile row.
 */
export class ProductImageResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: '/uploads/products/uuid.jpg' })
  urlPath: string;

  @ApiProperty({ example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ example: 204800 })
  fileSize: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ example: 'photo.jpg' })
  originalName: string;
}

/** Variant row embedded on product responses (price as number). */
export class ProductVariantEmbeddedDto {
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
}

/** Mirrors `mapProductToResponse` / `ProductWithRelations`. */
export class ProductResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  slug: string | null;

  @ApiProperty()
  storeId: number;

  @ApiProperty()
  categoryId: number;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  basePrice: number;

  @ApiProperty({ enum: ProductStatus })
  status: ProductStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ nullable: true })
  deletedAt: Date | null;

  @ApiProperty({ nullable: true })
  publishedAt: Date | null;

  @ApiPropertyOptional({ type: ProductStoreSummaryDto })
  store?: ProductStoreSummaryDto;

  @ApiPropertyOptional({ type: ProductCategorySummaryDto })
  category?: ProductCategorySummaryDto;

  @ApiPropertyOptional({ type: [ProductImageResponseDto] })
  images?: ProductImageResponseDto[];

  @ApiPropertyOptional({ type: [ProductVariantEmbeddedDto] })
  variants?: ProductVariantEmbeddedDto[];
}

export class PaginatedProductResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  data: ProductResponseDto[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;
}

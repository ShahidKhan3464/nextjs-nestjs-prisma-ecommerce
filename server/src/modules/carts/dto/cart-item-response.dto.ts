import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartItemStoreResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  verified: boolean;

  @ApiPropertyOptional({ nullable: true })
  logoUrl: string | null;

  @ApiProperty()
  sellerName: string;
}

/** Mirrors `CartItemResponse` from `mapCartItemToResponse`. */
export class CartItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  image: string;

  @ApiProperty()
  maxQty: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  variantId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  variantLabel: string;

  @ApiPropertyOptional({ type: CartItemStoreResponseDto, nullable: true })
  store: CartItemStoreResponseDto | null;
}

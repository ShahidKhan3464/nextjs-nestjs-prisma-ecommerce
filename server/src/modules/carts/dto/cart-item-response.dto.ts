import { ApiProperty } from '@nestjs/swagger';

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
}

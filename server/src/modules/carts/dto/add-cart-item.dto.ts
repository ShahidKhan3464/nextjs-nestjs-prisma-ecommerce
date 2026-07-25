import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export const CART_QUANTITY_MAX = 999;

export class AddCartItemDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  variantId: number;

  @ApiProperty({ example: 1, minimum: 1, maximum: CART_QUANTITY_MAX })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CART_QUANTITY_MAX)
  quantity: number;
}

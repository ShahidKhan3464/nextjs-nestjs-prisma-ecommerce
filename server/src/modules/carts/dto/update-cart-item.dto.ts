import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';
import { CART_QUANTITY_MAX } from './add-cart-item.dto';

export class UpdateCartItemDto {
  @ApiProperty({ example: 2, minimum: 1, maximum: CART_QUANTITY_MAX })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CART_QUANTITY_MAX)
  quantity: number;
}

import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CART_QUANTITY_MAX } from './add-cart-item.dto';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const SYNC_CART_MAX_ITEMS = 100;

class SyncCartLineDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  variantId: number;

  @ApiProperty({ minimum: 1, maximum: CART_QUANTITY_MAX })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CART_QUANTITY_MAX)
  quantity: number;
}

export class SyncCartDto {
  @ApiProperty({ type: [SyncCartLineDto], maxItems: SYNC_CART_MAX_ITEMS })
  @IsArray()
  @ArrayMaxSize(SYNC_CART_MAX_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => SyncCartLineDto)
  items: SyncCartLineDto[];
}

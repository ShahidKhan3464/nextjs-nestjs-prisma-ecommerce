import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsInt, Min } from 'class-validator';

export const SYNC_WISHLIST_MAX_ITEMS = 100;

export class SyncWishlistDto {
  @ApiProperty({
    type: [Number],
    example: [1, 2, 3],
    maxItems: SYNC_WISHLIST_MAX_ITEMS,
  })
  @IsArray()
  @ArrayMaxSize(SYNC_WISHLIST_MAX_ITEMS)
  @IsInt({ each: true })
  @Min(1, { each: true })
  productIds: number[];
}

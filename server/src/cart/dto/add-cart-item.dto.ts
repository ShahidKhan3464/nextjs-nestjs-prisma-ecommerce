import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCartItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  variantId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

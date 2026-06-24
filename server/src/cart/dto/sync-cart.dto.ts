import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';

class SyncCartLineDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  variantId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  quantity: number;
}

export class SyncCartDto {
  @ApiProperty({ type: [SyncCartLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncCartLineDto)
  items: SyncCartLineDto[];
}

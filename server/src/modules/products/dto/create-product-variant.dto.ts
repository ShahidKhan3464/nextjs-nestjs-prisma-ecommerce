import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  Min,
  IsInt,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

/** Used when parsing `variants` JSON on multipart product create */
export class CreateProductVariantDto {
  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  size: string;

  @ApiProperty({ example: 'Black' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  color: string;

  @ApiProperty({ example: 'SKU-001' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  sku: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 99.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
}

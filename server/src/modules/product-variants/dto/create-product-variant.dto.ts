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

export class CreateProductVariantDto {
  @ApiProperty({ example: 1, description: 'Owning product id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  productId: number;

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

  @ApiProperty({
    example: 10,
    description: 'Available stock (must be >= 0)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity: number;

  @ApiProperty({
    example: 99.99,
    description: 'Variant price (may differ from product basePrice)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
}

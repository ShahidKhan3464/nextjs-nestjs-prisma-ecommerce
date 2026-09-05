import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

/**
 * Store address/location is required at approval because SellerProfile has no
 * address fields and Store must not be created before approval.
 */
export class ApproveSellerProfileDto {
  @ApiPropertyOptional({
    example: 'Acme Store',
    description: 'Store display name (defaults to businessName)',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  storeName?: string;

  @ApiPropertyOptional({
    example: 'Quality goods from Acme',
    description: 'Optional store description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    example: '123 Market Street',
    description: 'Store street address',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  address: string;

  @ApiProperty({
    example: 'New York',
    description: 'Store city',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  city: string;

  @ApiProperty({
    example: '10001',
    description: 'Store postal code',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  postalCode: string;

  @ApiProperty({
    example: 'United States',
    description: 'Store country',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  country: string;
}

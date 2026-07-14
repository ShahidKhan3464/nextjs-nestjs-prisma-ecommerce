import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

/**
 * Payload for creating a Store for an approved SellerProfile.
 * Used only via StoreService / CreateStoreProvider — never exposed on a controller.
 */
export class CreateStoreDto {
  @ApiProperty({
    example: 'Acme Store',
    description: 'Store display name',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Quality goods from Acme',
    description: 'Optional store description',
    maxLength: 2000,
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

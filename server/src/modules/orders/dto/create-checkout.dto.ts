import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PHONE_REGEX,
  PHONE_MAX_LENGTH,
  PHONE_MIN_LENGTH,
  PHONE_VALIDATION_MESSAGE,
} from 'src/common/constants/phone.constants';
import {
  IsDefined,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ShippingAddressDto {
  @ApiProperty({ example: 'Jane Doe', maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: '123 Market Street', maxLength: 255 })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  line1: string;

  @ApiPropertyOptional({ example: 'Apt 4B', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line2?: string;

  @ApiProperty({ example: 'New York', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'NY', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  region: string;

  @ApiProperty({ example: '10001', maxLength: 20 })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  postalCode: string;

  @ApiProperty({ example: 'United States', maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  country: string;

  @ApiPropertyOptional({ example: '+1234567890', maxLength: PHONE_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MinLength(PHONE_MIN_LENGTH)
  @MaxLength(PHONE_MAX_LENGTH)
  @Matches(PHONE_REGEX, { message: `phone ${PHONE_VALIDATION_MESSAGE}` })
  phone?: string;
}

export class CreateCheckoutDto {
  @ApiProperty({ type: ShippingAddressDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({
    description:
      'Client-generated key so retries/double-clicks reuse the same checkout. Also accepted via the Idempotency-Key header.',
    maxLength: 128,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  idempotencyKey?: string;
}

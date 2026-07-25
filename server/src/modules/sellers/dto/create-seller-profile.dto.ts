import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PHONE_REGEX,
  PHONE_MAX_LENGTH,
  PHONE_MIN_LENGTH,
  PHONE_VALIDATION_MESSAGE,
} from 'src/common/constants/phone.constants';
import {
  IsEmail,
  Matches,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class CreateSellerProfileDto {
  @ApiProperty({
    example: 'Acme Trading LLC',
    description: 'Registered business / trade name',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  businessName: string;

  @ApiProperty({
    example: 'seller@acme.com',
    description: 'Business contact email (must be unique)',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  businessEmail: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Business contact phone',
    minLength: PHONE_MIN_LENGTH,
    maxLength: PHONE_MAX_LENGTH,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(PHONE_MIN_LENGTH)
  @MaxLength(PHONE_MAX_LENGTH)
  @Matches(PHONE_REGEX, {
    message: `businessPhone ${PHONE_VALIDATION_MESSAGE}`,
  })
  businessPhone: string;

  @ApiPropertyOptional({
    example: 'TAX-123456789',
    description: 'Tax identification number',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9\-./]+$/, {
    message: 'taxNumber contains invalid characters',
  })
  taxNumber?: string;

  @ApiPropertyOptional({
    example: 'REG-987654',
    description: 'Business registration number',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9\-./]+$/, {
    message: 'registrationNumber contains invalid characters',
  })
  registrationNumber?: string;
}

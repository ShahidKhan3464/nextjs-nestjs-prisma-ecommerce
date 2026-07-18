import { ApiPropertyOptional } from '@nestjs/swagger';
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
  IsOptional,
} from 'class-validator';

export class UpdateSellerProfileDto {
  @ApiPropertyOptional({
    example: 'Acme Trading LLC',
    description: 'Registered business / trade name',
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  businessName?: string;

  @ApiPropertyOptional({
    example: 'seller@acme.com',
    description: 'Business contact email (must remain unique)',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  businessEmail?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Business contact phone',
    minLength: PHONE_MIN_LENGTH,
    maxLength: PHONE_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MinLength(PHONE_MIN_LENGTH)
  @MaxLength(PHONE_MAX_LENGTH)
  @Matches(PHONE_REGEX, {
    message: `businessPhone ${PHONE_VALIDATION_MESSAGE}`,
  })
  businessPhone?: string;

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

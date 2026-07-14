import { ApiPropertyOptional } from '@nestjs/swagger';
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
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  @Matches(/^[+\d][\d\s()-]{6,29}$/, {
    message: 'businessPhone must be a valid phone number',
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

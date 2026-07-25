import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  PHONE_REGEX,
  PHONE_MAX_LENGTH,
  PHONE_MIN_LENGTH,
  PHONE_VALIDATION_MESSAGE,
} from 'src/common/constants/phone.constants';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Full name of the user',
    minLength: 2,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  fullName?: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'User phone number',
    minLength: PHONE_MIN_LENGTH,
    maxLength: PHONE_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MinLength(PHONE_MIN_LENGTH)
  @MaxLength(PHONE_MAX_LENGTH)
  @Matches(PHONE_REGEX, {
    message: `phoneNumber ${PHONE_VALIDATION_MESSAGE}`,
  })
  phoneNumber?: string;
}

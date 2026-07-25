import { ApiProperty } from '@nestjs/swagger';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_COMPLEXITY_REGEX,
  PASSWORD_COMPLEXITY_MESSAGE,
} from 'src/common/constants/password.constants';
import {
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'JWT from the password-reset email link',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'Password1!',
    description: 'New password',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @IsNotEmpty()
  @Matches(PASSWORD_COMPLEXITY_REGEX, {
    message: PASSWORD_COMPLEXITY_MESSAGE,
  })
  password: string;

  @ApiProperty({
    example: 'Password1!',
    description: 'Must match password',
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  @IsNotEmpty()
  @Matches(PASSWORD_COMPLEXITY_REGEX, {
    message: PASSWORD_COMPLEXITY_MESSAGE,
  })
  confirmPassword: string;
}

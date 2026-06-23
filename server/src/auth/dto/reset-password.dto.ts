import { ApiProperty } from '@nestjs/swagger';
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
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'Password1!',
    description: 'Must match password; same strength rules as registration',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  @IsNotEmpty()
  @Matches(
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    },
  )
  confirmPassword: string;
}

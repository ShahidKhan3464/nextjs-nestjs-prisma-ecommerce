import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  Matches,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'test user',
    description: 'Full name of the user',
    minLength: 5,
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(30)
  fullName: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'User phone number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiProperty({
    example: 'test@gmail.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password',
    description: 'User password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'password',
    description: 'User password',
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

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({
    description: 'The password of the user',
    example: 'Password@123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

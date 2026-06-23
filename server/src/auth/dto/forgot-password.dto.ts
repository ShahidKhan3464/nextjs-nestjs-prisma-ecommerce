import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'test@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail({}, { message: 'Invalid email' })
  email: string;
}

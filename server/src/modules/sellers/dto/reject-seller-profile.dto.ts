import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RejectSellerProfileDto {
  @ApiProperty({
    example: 'Incomplete business registration documents',
    description: 'Reason the seller application was rejected',
    minLength: 5,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(1000)
  rejectedReason: string;
}

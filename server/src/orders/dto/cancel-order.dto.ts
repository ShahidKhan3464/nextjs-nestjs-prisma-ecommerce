import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({
    description: 'Reason for cancelling the order',
    example: 'Changed my mind',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}

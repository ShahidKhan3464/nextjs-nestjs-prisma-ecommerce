import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BlockUserDto {
  @ApiProperty({
    example: true,
    description: 'Whether the user account should be blocked',
  })
  @IsBoolean()
  isBlocked: boolean;
}

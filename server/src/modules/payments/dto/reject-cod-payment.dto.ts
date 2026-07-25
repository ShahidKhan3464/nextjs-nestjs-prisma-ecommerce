import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectCodPaymentDto {
  @ApiPropertyOptional({
    description: 'Optional rejection note (defaults to COD rejected)',
    example: 'Customer unavailable at delivery address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

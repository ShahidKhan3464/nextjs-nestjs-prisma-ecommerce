import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SuspendSellerProfileDto {
  @ApiPropertyOptional({
    example: 'Policy violations reported by buyers',
    description: 'Optional suspension reason stored on the Store',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  suspensionReason?: string;
}

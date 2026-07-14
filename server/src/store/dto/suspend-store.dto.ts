import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SuspendStoreDto {
  @ApiPropertyOptional({
    example: 'Policy violations reported by buyers',
    description: 'Optional suspension reason',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  suspensionReason?: string;
}

import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RecordRefundDto {
  @ApiPropertyOptional({
    description:
      'Refund amount in major currency units. Omit for a full remaining refund.',
    example: 19.99,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiProperty({
    description: 'Reason for the refund',
    example: 'Customer cancelled pending order',
  })
  @IsString()
  @MaxLength(255)
  reason: string;

  @ApiPropertyOptional({
    description: 'External refund id from the payment provider (if any)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  externalRefundId?: string;
}

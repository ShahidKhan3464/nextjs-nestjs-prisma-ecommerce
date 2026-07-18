import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider, PaymentStatus } from '../constants/payment.constants';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';
import {
  IsInt,
  IsEnum,
  IsString,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class QueryPaymentDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'PAID' || value === 'paid' ? PaymentStatus.SUCCEEDED : value,
  )
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentProvider })
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

  @ApiPropertyOptional({ description: 'Filter by order id' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  orderId?: number;

  @ApiPropertyOptional({
    description: 'Filter by buyer user id (admin only)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @ApiPropertyOptional({
    description: 'Filter by store id (admin only)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  storeId?: number;

  @ApiPropertyOptional({
    description: 'Provider transaction / PaymentIntent reference',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Only payments that have a failure reason',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  hasFailure?: boolean;

  @ApiPropertyOptional({
    description: 'Only payments with a refunded amount greater than zero',
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  hasRefund?: boolean;
}

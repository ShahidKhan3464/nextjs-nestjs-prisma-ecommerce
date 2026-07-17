import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../constants/order.constants';

export class QueryOrderDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    description: 'Also accepts legacy PAID (mapped to SUCCEEDED)',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'PAID' || value === 'paid' ? PaymentStatus.SUCCEEDED : value,
  )
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;
}

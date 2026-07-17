import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../constants/order.constants';
import { PaginationQueryDto } from 'src/common/pagination/dto/pagination-query.dto';

export class QueryOrderDto extends PaginationQueryDto {
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
}

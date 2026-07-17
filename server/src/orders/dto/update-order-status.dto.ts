import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../constants/order.constants';

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: [OrderStatus.SHIPPED, OrderStatus.DELIVERED],
    description: 'Allowed next status for the order',
  })
  @IsIn([OrderStatus.SHIPPED, OrderStatus.DELIVERED])
  status: OrderStatus.SHIPPED | OrderStatus.DELIVERED;
}

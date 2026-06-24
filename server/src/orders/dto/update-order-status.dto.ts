import { IsIn } from 'class-validator';
import { OrderStatus } from '../constants/order.constants';

export class UpdateOrderStatusDto {
  @IsIn([OrderStatus.SHIPPED, OrderStatus.DELIVERED])
  status: OrderStatus.SHIPPED | OrderStatus.DELIVERED;
}

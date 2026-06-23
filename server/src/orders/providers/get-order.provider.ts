import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/users/constants/user.constants';
import { joinProductImages } from 'src/common/files/file-query.util';
import { OrderResponse, mapOrderToResponse } from '../utils/map-order.util';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class GetOrderProvider {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly usersService: UsersService,
  ) {}

  async findOne(
    orderId: number,
    userId: number,
  ): Promise<{ order: OrderResponse; customerUserId: string }> {
    const order = await joinProductImages(
      this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.variant', 'variant')
        .leftJoinAndSelect('variant.product', 'product')
        .withDeleted()
        .where('order.id = :orderId', { orderId }),
      'product',
    ).getOne();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const user = await this.usersService.findOneById(userId);
    const isAdmin = user?.role === UserRole.ADMIN;

    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException();
    }

    return {
      order: mapOrderToResponse(order),
      customerUserId: String(order.userId),
    };
  }
}

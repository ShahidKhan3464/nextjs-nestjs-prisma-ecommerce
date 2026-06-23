import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { OrderStatus } from '../constants/order.constants';
import { MailService } from 'src/mail/providers/mail.service';
import { joinProductImages } from 'src/common/files/file-query.util';
import { OrderResponse, mapOrderToResponse } from '../utils/map-order.util';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

const ALLOWED_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING]: [OrderStatus.SHIPPED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
};

@Injectable()
export class UpdateOrderStatusProvider {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {}

  async update(orderId: number, status: OrderStatus): Promise<OrderResponse> {
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

    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition order from ${order.status} to ${status}`,
      );
    }

    const previousStatus = order.status;
    order.status = status;

    if (status === OrderStatus.SHIPPED && !order.shippedAt) {
      order.shippedAt = new Date();
    }
    if (status === OrderStatus.DELIVERED && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    await this.orderRepository.save(order);

    const response = mapOrderToResponse(order);

    if (previousStatus !== status) {
      const customer = await this.usersService.findOneById(order.userId);
      if (customer?.email) {
        void this.mailService
          .sendOrderStatusUpdateEmail(
            customer.email,
            customer.fullName,
            response,
            status,
          )
          .catch(() => undefined);
      }
    }

    return response;
  }
}

import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from '../constants/order.constants';
import { MailService } from 'src/mail/providers/mail.service';
import { findOrderWithImages } from 'src/common/files/file-query.util';
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
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {}

  async update(orderId: number, status: OrderStatus): Promise<OrderResponse> {
    const order = await findOrderWithImages(this.prisma, { id: orderId });

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

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === OrderStatus.SHIPPED && !order.shippedAt
          ? { shippedAt: new Date() }
          : {}),
        ...(status === OrderStatus.DELIVERED && !order.deliveredAt
          ? { deliveredAt: new Date() }
          : {}),
      },
    });

    order.status = updated.status as OrderStatus;
    order.shippedAt = updated.shippedAt;
    order.deliveredAt = updated.deliveredAt;

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

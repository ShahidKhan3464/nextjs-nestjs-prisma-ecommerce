import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { findOrderWithImages } from 'src/common/files/file-query.util';
import { OrderResponse, mapOrderToResponse } from '../utils/map-order.util';
import {
  isSuperAdmin,
  extractUserRoles,
} from 'src/common/utils/authorization.util';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class GetOrderProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async findOne(
    orderId: number,
    userId: number,
  ): Promise<{ order: OrderResponse; customerUserId: string }> {
    const order = await findOrderWithImages(this.prisma, { id: orderId });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const user = await this.usersService.findOneByIdWithRoles(userId);
    const isAdmin = user ? isSuperAdmin(extractUserRoles(user)) : false;

    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException();
    }

    return {
      order: mapOrderToResponse(order),
      customerUserId: String(order.userId),
    };
  }
}

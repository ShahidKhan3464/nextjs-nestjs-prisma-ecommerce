import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { findOrderWithImages } from 'src/common/files/file-query.util';
import { OrderResponse, mapOrderToResponse } from '../utils/map-order.util';
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

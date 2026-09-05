import { PrismaService } from 'src/prisma/prisma.service';
import type { OrderResponse } from '../types/order.types';
import { UserRole } from 'src/common/enums/user-role.enum';
import { mapOrderToResponse } from '../utils/map-order.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderOwnershipProvider } from './order-ownership.provider';
import { findOrderWithImages } from 'src/common/prisma/file-query.util';
import { hasAnyRole, isSuperAdmin } from 'src/common/utils/authorization.util';

@Injectable()
export class GetOrderProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orderOwnershipProvider: OrderOwnershipProvider,
  ) {}

  async findOne(
    orderId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<{ order: OrderResponse; customerUserId: string }> {
    const order = await findOrderWithImages(this.prisma, { id: orderId });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    let ownedStoreId: number | null = null;
    if (
      !isSuperAdmin(roles) &&
      order.userId !== userId &&
      hasAnyRole(roles, [UserRole.SELLER])
    ) {
      ownedStoreId = await this.orderOwnershipProvider.findOwnedStoreId(userId);
    }

    this.orderOwnershipProvider.assertCanView(
      order,
      userId,
      roles,
      ownedStoreId,
    );

    return {
      order: mapOrderToResponse(order, {
        includeBuyer: this.orderOwnershipProvider.shouldIncludeBuyer(roles),
      }),
      customerUserId: String(order.userId),
    };
  }
}

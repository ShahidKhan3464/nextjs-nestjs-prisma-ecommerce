import { PrismaService } from 'src/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { findOrdersWithImages } from 'src/common/files/file-query.util';
import { UserResponse, mapUserToResponse } from '../utils/map-user.util';
import { USER_ROLES_INCLUDE } from 'src/common/constants/user-roles.constants';
import {
  OrderAddress,
  OrderResponse,
  mapOrderToResponse,
} from 'src/orders/utils/map-order.util';

export type UserDetailResponse = {
  user: UserResponse;
  totalOrders: number;
  totalSpending: number;
  wishlistCount: number;
  profilePhotoUrl?: string;
  recentOrders: OrderResponse[];
  defaultAddress?: OrderAddress;
  billingAddresses: OrderAddress[];
  shippingAddresses: OrderAddress[];
};

@Injectable()
export class GetUserDetailProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getDetail(userId: number): Promise<UserDetailResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: USER_ROLES_INCLUDE,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const avatar = await this.prisma.userFile.findFirst({
      where: { userId, type: 'AVATAR' },
      orderBy: { sortOrder: 'asc' },
      include: { file: { select: { urlPath: true } } },
    });

    const orders = await findOrdersWithImages(this.prisma, {
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const orderResponses = orders.map((order) => mapOrderToResponse(order));
    const totalSpending = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    const addresses = orderResponses
      .map((o) => o.shippingAddress)
      .filter((addr) => addr.line1?.trim());

    const uniqueAddresses = this.dedupeAddresses(addresses);

    const wishlistCount = await this.prisma.wishlistItem.count({
      where: { userId },
    });

    return {
      user: mapUserToResponse(user),
      wishlistCount,
      totalOrders: orders.length,
      billingAddresses: uniqueAddresses,
      defaultAddress: uniqueAddresses[0],
      shippingAddresses: uniqueAddresses,
      profilePhotoUrl: avatar?.file.urlPath,
      recentOrders: orderResponses.slice(0, 5),
      totalSpending: Math.round(totalSpending * 100) / 100,
    };
  }

  private dedupeAddresses(addresses: OrderAddress[]): OrderAddress[] {
    const seen = new Set<string>();
    const result: OrderAddress[] = [];
    for (const addr of addresses) {
      const key = [
        addr.fullName,
        addr.line1,
        addr.line2 ?? '',
        addr.city,
        addr.region,
        addr.postalCode,
        addr.country,
      ].join('|');
      if (!seen.has(key)) {
        seen.add(key);
        result.push(addr);
      }
    }
    return result;
  }
}

import type { UserResponse } from '../types/user.types';
import { PrismaService } from 'src/prisma/prisma.service';
import { mapUserToResponse } from '../utils/map-user.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { findOrdersWithImages } from 'src/common/prisma/file-query.util';
import { mapOrderToResponse } from 'src/modules/orders/utils/map-order.util';
import { USER_ROLES_INCLUDE } from 'src/common/constants/user-roles.constants';
import type {
  OrderAddress,
  OrderResponse,
} from 'src/modules/orders/types/order.types';

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

const RECENT_ORDERS_LIMIT = 5;
const ADDRESS_SCAN_LIMIT = 50;

@Injectable()
export class GetUserDetailProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getDetail(userId: number): Promise<UserDetailResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: USER_ROLES_INCLUDE,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [
      avatar,
      totalOrders,
      spendingAgg,
      recentOrders,
      addressRows,
      wishlistCount,
    ] = await Promise.all([
      this.prisma.userFile.findFirst({
        where: { userId, type: 'AVATAR' },
        orderBy: { sortOrder: 'asc' },
        include: { file: { select: { urlPath: true } } },
      }),
      this.prisma.order.count({ where: { userId } }),
      this.prisma.order.aggregate({
        where: { userId },
        _sum: { totalAmount: true },
      }),
      findOrdersWithImages(this.prisma, {
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: RECENT_ORDERS_LIMIT,
      }),
      this.prisma.order.findMany({
        where: { userId },
        select: { shippingAddress: true },
        orderBy: { createdAt: 'desc' },
        take: ADDRESS_SCAN_LIMIT,
      }),
      this.prisma.wishlistItem.count({ where: { userId } }),
    ]);

    const uniqueAddresses = this.dedupeAddresses(
      this.parseAddresses(addressRows.map((row) => row.shippingAddress)),
    );

    return {
      totalOrders,
      wishlistCount,
      user: mapUserToResponse(user),
      billingAddresses: uniqueAddresses,
      defaultAddress: uniqueAddresses[0],
      shippingAddresses: uniqueAddresses,
      profilePhotoUrl: avatar?.file.urlPath,
      recentOrders: recentOrders.map((order) => mapOrderToResponse(order)),
      totalSpending:
        Math.round(Number(spendingAgg._sum.totalAmount ?? 0) * 100) / 100,
    };
  }

  private parseAddresses(raw: string[]): OrderAddress[] {
    const result: OrderAddress[] = [];
    for (const value of raw) {
      try {
        const parsed = JSON.parse(value) as OrderAddress;
        if (parsed?.line1?.trim()) {
          result.push(parsed);
        }
      } catch {
        /* skip malformed historical addresses */
      }
    }
    return result;
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

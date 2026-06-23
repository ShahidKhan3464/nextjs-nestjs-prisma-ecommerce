import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from 'src/orders/entities/order.entity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FileOwnerModule } from 'src/common/files/file.constants';
import { joinProductImages } from 'src/common/files/file-query.util';
import { UserResponse, mapUserToResponse } from '../utils/map-user.util';
import { StoredFile } from 'src/common/files/entities/stored-file.entity';
import { WishlistItem } from 'src/wishlist/entities/wishlist-item.entity';
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
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(WishlistItem)
    private readonly wishlistRepository: Repository<WishlistItem>,
    @InjectRepository(StoredFile)
    private readonly fileRepository: Repository<StoredFile>,
  ) {}

  async getDetail(userId: number): Promise<UserDetailResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const avatar = await this.fileRepository.findOne({
      where: { ownerModule: FileOwnerModule.CUSTOMER, ownerId: userId },
      order: { sortOrder: 'ASC' },
    });

    const orders = await joinProductImages(
      this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.variant', 'variant')
        .leftJoinAndSelect('variant.product', 'product')
        .withDeleted()
        .where('order.userId = :userId', { userId })
        .orderBy('order.createdAt', 'DESC'),
      'product',
    ).getMany();

    const orderResponses = orders.map(mapOrderToResponse);
    const totalSpending = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    const addresses = orderResponses
      .map((o) => o.shippingAddress)
      .filter((addr) => addr.line1?.trim());

    const uniqueAddresses = this.dedupeAddresses(addresses);

    const wishlistCount = await this.wishlistRepository.count({
      where: { userId },
    });

    return {
      user: mapUserToResponse(user),
      wishlistCount,
      totalOrders: orders.length,
      profilePhotoUrl: avatar?.urlPath,
      billingAddresses: uniqueAddresses,
      defaultAddress: uniqueAddresses[0],
      shippingAddresses: uniqueAddresses,
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

import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { isSuperAdmin } from 'src/common/utils/authorization.util';
import { SellerProfileStatus } from 'src/modules/sellers/constants/seller.constants';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class FileAuthorizationProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async assertCanManageProduct(
    productId: number,
    userId: number,
    _roles: UserRole[],
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      include: {
        store: {
          include: {
            sellerProfile: {
              select: { userId: true, status: true, deletedAt: true },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const profile = product.store.sellerProfile;
    if (!profile || profile.deletedAt || profile.userId !== userId) {
      throw new ForbiddenException('You do not own this product');
    }

    if (profile.status !== SellerProfileStatus.APPROVED) {
      throw new ForbiddenException(
        'Only approved sellers may manage product files',
      );
    }

    return product;
  }

  public async assertCanManageStore(
    storeId: number,
    userId: number,
    _roles: UserRole[],
  ) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, deletedAt: null },
      include: {
        sellerProfile: {
          select: { userId: true, status: true, deletedAt: true },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (
      !store.sellerProfile ||
      store.sellerProfile.deletedAt ||
      store.sellerProfile.userId !== userId
    ) {
      throw new ForbiddenException('You do not own this store');
    }

    if (store.sellerProfile.status !== SellerProfileStatus.APPROVED) {
      throw new ForbiddenException(
        'Only approved sellers may manage store files',
      );
    }

    if (store.status === 'SUSPENDED') {
      throw new ForbiddenException('Suspended stores cannot manage files');
    }

    return store;
  }

  public async assertCanManageUser(
    targetUserId: number,
    actorUserId: number,
    roles: UserRole[],
  ): Promise<void> {
    if (isSuperAdmin(roles) || targetUserId === actorUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return;
    }

    throw new ForbiddenException('You do not own this user file');
  }

  public async assertCanManageSellerProfile(
    sellerProfileId: number,
    userId: number,
    roles: UserRole[],
  ) {
    const profile = await this.prisma.sellerProfile.findFirst({
      where: { id: sellerProfileId, deletedAt: null },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    if (isSuperAdmin(roles)) {
      return profile;
    }

    if (profile.userId !== userId) {
      throw new ForbiddenException('You do not own this seller profile');
    }

    if (
      profile.status === SellerProfileStatus.SUSPENDED ||
      profile.status === SellerProfileStatus.REJECTED
    ) {
      throw new ForbiddenException(
        'Documents cannot be managed for rejected or suspended profiles',
      );
    }

    return profile;
  }

  public async findOwnedStoreIdOrThrow(userId: number): Promise<number> {
    const store = await this.prisma.store.findFirst({
      where: {
        deletedAt: null,
        sellerProfile: { userId, deletedAt: null },
      },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found for this seller');
    }

    return store.id;
  }

  public async findOwnedSellerProfileIdOrThrow(
    userId: number,
  ): Promise<number> {
    const profile = await this.prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    return profile.id;
  }
}

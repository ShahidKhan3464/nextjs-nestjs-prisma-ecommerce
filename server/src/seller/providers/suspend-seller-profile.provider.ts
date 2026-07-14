import { PrismaService } from 'src/prisma/prisma.service';
import { StoreStatus } from 'src/store/constants/store.constants';
import { SuspendSellerProfileDto } from '../dto/suspend-seller-profile.dto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  SellerProfileStatus,
  SELLER_PROFILE_INCLUDE,
} from '../constants/seller.constants';
import {
  SellerProfileMapped,
  mapSellerProfileToResponse,
} from '../utils/map-seller-profile.util';

@Injectable()
export class SuspendSellerProfileProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async suspend(
    id: number,
    dto: SuspendSellerProfileDto = {},
  ): Promise<SellerProfileMapped> {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.sellerProfile.findFirst({
        where: { id, deletedAt: null },
        include: { store: true },
      });

      if (!profile) {
        throw new NotFoundException('Seller profile not found');
      }

      if (profile.status === SellerProfileStatus.SUSPENDED) {
        throw new BadRequestException('Seller profile is already suspended');
      }

      if (
        profile.status !== SellerProfileStatus.APPROVED &&
        profile.status !== SellerProfileStatus.PENDING
      ) {
        throw new BadRequestException(
          `Seller profile with status ${profile.status} cannot be suspended`,
        );
      }

      const now = new Date();

      await tx.sellerProfile.update({
        where: { id: profile.id },
        data: {
          status: SellerProfileStatus.SUSPENDED,
        },
      });

      if (profile.store && profile.store.deletedAt === null) {
        await tx.store.update({
          where: { id: profile.store.id },
          data: {
            suspendedAt: now,
            status: StoreStatus.SUSPENDED,
            suspensionReason: dto.suspensionReason?.trim() || null,
          },
        });
      }

      const updated = await tx.sellerProfile.findFirst({
        where: { id: profile.id, deletedAt: null },
        include: SELLER_PROFILE_INCLUDE,
      });

      if (!updated) {
        throw new NotFoundException('Seller profile not found after suspend');
      }

      return mapSellerProfileToResponse(updated);
    });
  }
}

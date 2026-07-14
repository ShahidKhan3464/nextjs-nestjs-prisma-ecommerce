import { PrismaService } from 'src/prisma/prisma.service';
import { RejectSellerProfileDto } from '../dto/reject-seller-profile.dto';
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
export class RejectSellerProfileProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async reject(
    id: number,
    dto: RejectSellerProfileDto,
  ): Promise<SellerProfileMapped> {
    const profile = await this.prisma.sellerProfile.findFirst({
      where: { id, deletedAt: null },
      include: { store: true },
    });

    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    if (profile.status !== SellerProfileStatus.PENDING) {
      throw new BadRequestException(
        `Only PENDING seller profiles can be rejected (current: ${profile.status})`,
      );
    }

    if (profile.store) {
      throw new BadRequestException(
        'Cannot reject a seller profile that already has a store',
      );
    }

    const updated = await this.prisma.sellerProfile.update({
      where: { id: profile.id },
      data: {
        approvedAt: null,
        status: SellerProfileStatus.REJECTED,
        rejectedReason: dto.rejectedReason.trim(),
      },
      include: SELLER_PROFILE_INCLUDE,
    });

    return mapSellerProfileToResponse(updated);
  }
}

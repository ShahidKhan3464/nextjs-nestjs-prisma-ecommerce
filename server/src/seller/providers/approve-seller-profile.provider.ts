import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { StoreStatus } from 'src/store/constants/store.constants';
import { generateStoreSlug } from '../utils/generate-store-slug.util';
import { ApproveSellerProfileDto } from '../dto/approve-seller-profile.dto';
import {
  Injectable,
  ConflictException,
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
export class ApproveSellerProfileProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async approve(
    id: number,
    dto: ApproveSellerProfileDto,
  ): Promise<SellerProfileMapped> {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.sellerProfile.findFirst({
        where: { id, deletedAt: null },
        include: { store: true },
      });

      if (!profile) {
        throw new NotFoundException('Seller profile not found');
      }

      if (profile.status !== SellerProfileStatus.PENDING) {
        throw new BadRequestException(
          `Only PENDING seller profiles can be approved (current: ${profile.status})`,
        );
      }

      if (profile.store) {
        throw new ConflictException(
          'Seller profile already has a store; cannot approve again',
        );
      }

      const storeName = (dto.storeName?.trim() || profile.businessName).trim();
      const baseSlug = generateStoreSlug(storeName) || `store-${profile.id}`;
      const slug = await this.resolveUniqueSlug(tx, baseSlug);

      await tx.sellerProfile.update({
        where: { id: profile.id },
        data: {
          status: SellerProfileStatus.APPROVED,
          approvedAt: new Date(),
          rejectedReason: null,
        },
      });

      await tx.store.create({
        data: {
          slug,
          name: storeName,
          city: dto.city.trim(),
          verifiedAt: new Date(),
          status: StoreStatus.ACTIVE,
          address: dto.address.trim(),
          sellerProfileId: profile.id,
          country: dto.country.trim(),
          postalCode: dto.postalCode.trim(),
          description: dto.description?.trim() || null,
        },
      });

      const existingSellerRole = await tx.userRole.findUnique({
        where: {
          userId_role: {
            userId: profile.userId,
            role: UserRole.SELLER,
          },
        },
      });

      if (!existingSellerRole) {
        await tx.userRole.create({
          data: {
            userId: profile.userId,
            role: UserRole.SELLER,
          },
        });
      }

      const updated = await tx.sellerProfile.findFirst({
        where: { id: profile.id, deletedAt: null },
        include: SELLER_PROFILE_INCLUDE,
      });

      if (!updated) {
        throw new NotFoundException('Seller profile not found after approval');
      }

      return mapSellerProfileToResponse(updated);
    });
  }

  private async resolveUniqueSlug(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    baseSlug: string,
  ): Promise<string> {
    let candidate = baseSlug;
    let suffix = 0;

    while (true) {
      const existing = await tx.store.findFirst({
        where: { slug: candidate, deletedAt: null },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }
  }
}

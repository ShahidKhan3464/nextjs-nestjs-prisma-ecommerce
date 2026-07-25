import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateSellerProfileDto } from '../dto/update-seller-profile.dto';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
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
export class UpdateSellerProfileProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async updateMe(
    userId: number,
    dto: UpdateSellerProfileDto,
  ): Promise<SellerProfileMapped> {
    const profile = await this.prisma.sellerProfile.findFirst({
      where: { userId, deletedAt: null },
    });
    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    return this.applyUpdate(profile.id, profile.status, dto, {
      allowPendingFields: true,
      allowApprovedLimited: true,
    });
  }

  private async applyUpdate(
    profileId: number,
    currentStatus: string,
    dto: UpdateSellerProfileDto,
    rules: { allowPendingFields: boolean; allowApprovedLimited: boolean },
  ): Promise<SellerProfileMapped> {
    if (currentStatus === SellerProfileStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Suspended seller profiles cannot be updated',
      );
    }

    if (currentStatus === SellerProfileStatus.REJECTED) {
      throw new ForbiddenException(
        'Rejected seller profiles cannot be updated. Submit a new application after admin review guidance.',
      );
    }

    const isPending = currentStatus === SellerProfileStatus.PENDING;
    const isApproved = currentStatus === SellerProfileStatus.APPROVED;

    if (isPending && !rules.allowPendingFields) {
      throw new ForbiddenException('You cannot update this seller profile');
    }

    if (isApproved && !rules.allowApprovedLimited) {
      throw new ForbiddenException('You cannot update this seller profile');
    }

    if (
      isApproved &&
      (dto.businessName !== undefined ||
        dto.businessEmail !== undefined ||
        dto.taxNumber !== undefined ||
        dto.registrationNumber !== undefined)
    ) {
      throw new ForbiddenException(
        'Approved sellers may only update businessPhone. Contact support for other changes.',
      );
    }

    if (
      dto.taxNumber === undefined &&
      dto.businessName === undefined &&
      dto.businessEmail === undefined &&
      dto.businessPhone === undefined &&
      dto.registrationNumber === undefined
    ) {
      throw new BadRequestException('No fields provided to update');
    }

    if (dto.businessEmail !== undefined) {
      const businessEmail = dto.businessEmail.trim().toLowerCase();
      const emailTaken = await this.prisma.sellerProfile.findFirst({
        where: {
          businessEmail,
          NOT: { id: profileId },
        },
      });
      if (emailTaken) {
        throw new ConflictException('Business email is already in use');
      }
    }

    const updated = await this.prisma.sellerProfile.update({
      where: { id: profileId },
      data: {
        ...(dto.businessName !== undefined
          ? { businessName: dto.businessName.trim() }
          : {}),
        ...(dto.businessEmail !== undefined
          ? { businessEmail: dto.businessEmail.trim().toLowerCase() }
          : {}),
        ...(dto.businessPhone !== undefined
          ? { businessPhone: dto.businessPhone.trim() }
          : {}),
        ...(dto.taxNumber !== undefined
          ? { taxNumber: dto.taxNumber.trim() || null }
          : {}),
        ...(dto.registrationNumber !== undefined
          ? { registrationNumber: dto.registrationNumber.trim() || null }
          : {}),
      },
      include: SELLER_PROFILE_INCLUDE,
    });

    return mapSellerProfileToResponse(updated);
  }
}

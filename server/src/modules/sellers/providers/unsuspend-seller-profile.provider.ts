import { PrismaService } from 'src/prisma/prisma.service';
import { AuditProvider } from 'src/common/audit/audit.provider';
import { StoreStatus } from 'src/modules/stores/constants/store.constants';
import { AuditAction, AuditEntityType } from 'src/common/audit/audit.constants';
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
export class UnsuspendSellerProfileProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditProvider: AuditProvider,
  ) {}

  public async unsuspend(id: number): Promise<SellerProfileMapped> {
    const response = await this.prisma.$transaction(async (tx) => {
      const profile = await tx.sellerProfile.findFirst({
        where: { id, deletedAt: null },
        include: { store: true },
      });

      if (!profile) {
        throw new NotFoundException('Seller profile not found');
      }

      if (profile.status !== 'SUSPENDED') {
        throw new BadRequestException('Seller profile is not suspended');
      }

      const restoreToApproved =
        profile.approvedAt != null ||
        (profile.store != null && profile.store.deletedAt === null);

      const nextStatus = restoreToApproved
        ? SellerProfileStatus.APPROVED
        : SellerProfileStatus.PENDING;

      await tx.sellerProfile.update({
        where: { id: profile.id },
        data: { status: nextStatus },
      });

      if (
        restoreToApproved &&
        profile.store &&
        profile.store.deletedAt === null &&
        profile.store.status === 'SUSPENDED'
      ) {
        await tx.store.update({
          where: { id: profile.store.id },
          data: {
            suspendedAt: null,
            suspensionReason: null,
            status: StoreStatus.ACTIVE,
          },
        });
      }

      const updated = await tx.sellerProfile.findFirst({
        where: { id: profile.id, deletedAt: null },
        include: SELLER_PROFILE_INCLUDE,
      });

      if (!updated) {
        throw new NotFoundException('Seller profile not found after unsuspend');
      }

      return mapSellerProfileToResponse(updated);
    });

    this.auditProvider.record({
      action: AuditAction.SELLER_UNSUSPENDED,
      entityType: AuditEntityType.SELLER_PROFILE,
      entityId: id,
      after: { status: response.status },
    });
    return response;
  }
}

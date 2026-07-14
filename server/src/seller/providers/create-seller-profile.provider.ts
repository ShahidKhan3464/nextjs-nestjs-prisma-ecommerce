import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSellerProfileDto } from '../dto/create-seller-profile.dto';
import {
  Injectable,
  ConflictException,
  NotFoundException,
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
export class CreateSellerProfileProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async create(
    userId: number,
    dto: CreateSellerProfileDto,
  ): Promise<SellerProfileMapped> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingProfile = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });
    if (existingProfile) {
      throw new ConflictException('User already owns a seller profile');
    }

    const businessEmail = dto.businessEmail.trim().toLowerCase();
    const emailTaken = await this.prisma.sellerProfile.findUnique({
      where: { businessEmail },
    });
    if (emailTaken) {
      throw new ConflictException('Business email is already in use');
    }

    const profile = await this.prisma.sellerProfile.create({
      data: {
        userId,
        businessEmail,
        status: SellerProfileStatus.PENDING,
        businessName: dto.businessName.trim(),
        businessPhone: dto.businessPhone.trim(),
        taxNumber: dto.taxNumber?.trim() || null,
        registrationNumber: dto.registrationNumber?.trim() || null,
      },
      include: SELLER_PROFILE_INCLUDE,
    });

    return mapSellerProfileToResponse(profile);
  }
}

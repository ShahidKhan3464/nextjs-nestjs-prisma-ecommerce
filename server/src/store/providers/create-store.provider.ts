import { CreateStoreDto } from '../dto/create-store.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { generateStoreSlug } from '../utils/generate-store-slug.util';
import { StoreMapped, mapStoreToResponse } from '../utils/map-store.util';
import { StoreStatus, STORE_INCLUDE } from '../constants/store.constants';
import { SellerProfileStatus } from 'src/seller/constants/seller.constants';
import { resolveUniqueStoreSlug } from '../utils/resolve-unique-store-slug.util';
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

/**
 * Creates a Store for an APPROVED SellerProfile (one store per profile).
 * Intended for internal / service use — never bound directly to a controller.
 */
@Injectable()
export class CreateStoreProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async create(
    sellerProfileId: number,
    dto: CreateStoreDto,
  ): Promise<StoreMapped> {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.sellerProfile.findFirst({
        where: { id: sellerProfileId, deletedAt: null },
        include: { store: true },
      });

      if (!profile) {
        throw new NotFoundException('Seller profile not found');
      }

      if (profile.status !== SellerProfileStatus.APPROVED) {
        throw new BadRequestException(
          'Stores can only be created for APPROVED seller profiles',
        );
      }

      if (profile.store) {
        if (profile.store.deletedAt === null) {
          throw new ConflictException(
            'Seller profile already owns a store (one store per seller)',
          );
        }
        throw new ConflictException(
          'A soft-deleted store already exists for this seller profile',
        );
      }

      const name = dto.name.trim();
      const baseSlug = generateStoreSlug(name) || `store-${profile.id}`;
      const slug = await resolveUniqueStoreSlug(tx, baseSlug);

      const created = await tx.store.create({
        data: {
          slug,
          name,
          city: dto.city.trim(),
          status: StoreStatus.ACTIVE,
          address: dto.address.trim(),
          sellerProfileId: profile.id,
          country: dto.country.trim(),
          postalCode: dto.postalCode.trim(),
          description: dto.description?.trim() || null,
        },
        include: STORE_INCLUDE,
      });

      return mapStoreToResponse(created);
    });
  }
}

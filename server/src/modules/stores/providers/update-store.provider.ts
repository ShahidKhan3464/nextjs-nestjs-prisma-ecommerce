import type { StoreMapped } from '../types/store.types';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { STORE_INCLUDE } from '../constants/store.constants';
import { mapStoreToResponse } from '../utils/map-store.util';
import { Injectable, BadRequestException } from '@nestjs/common';
import { StoreOwnershipProvider } from './store-ownership.provider';
import { generateStoreSlug } from '../utils/generate-store-slug.util';
import { resolveUniqueStoreSlug } from '../utils/resolve-unique-store-slug.util';

@Injectable()
export class UpdateStoreProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storeOwnershipProvider: StoreOwnershipProvider,
  ) {}

  public async updateMe(
    userId: number,
    roles: UserRole[],
    dto: UpdateStoreDto,
  ): Promise<StoreMapped> {
    const owned =
      await this.storeOwnershipProvider.findOwnedStoreOrThrow(userId);
    return this.applyUpdate(owned.id, userId, roles, dto);
  }

  public async updateById(
    storeId: number,
    userId: number,
    roles: UserRole[],
    dto: UpdateStoreDto,
  ): Promise<StoreMapped> {
    return this.applyUpdate(storeId, userId, roles, dto);
  }

  private async applyUpdate(
    storeId: number,
    userId: number,
    roles: UserRole[],
    dto: UpdateStoreDto,
  ): Promise<StoreMapped> {
    await this.storeOwnershipProvider.assertCanManage(storeId, userId, roles);

    const store =
      await this.storeOwnershipProvider.findStoreByIdOrThrow(storeId);
    this.storeOwnershipProvider.assertNotSuspended(store.status);

    if (
      dto.name === undefined &&
      dto.description === undefined &&
      dto.address === undefined &&
      dto.city === undefined &&
      dto.postalCode === undefined &&
      dto.country === undefined
    ) {
      throw new BadRequestException('No fields provided to update');
    }

    return this.prisma.$transaction(async (tx) => {
      let slug: string | undefined;

      if (dto.name !== undefined) {
        const name = dto.name.trim();
        const baseSlug = generateStoreSlug(name) || `store-${store.id}`;
        slug = await resolveUniqueStoreSlug(tx, baseSlug, store.id);
      }

      const updated = await tx.store.update({
        where: { id: store.id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim(), slug } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description.trim() || null }
            : {}),
          ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
          ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
          ...(dto.postalCode !== undefined
            ? { postalCode: dto.postalCode.trim() }
            : {}),
          ...(dto.country !== undefined ? { country: dto.country.trim() } : {}),
        },
        include: STORE_INCLUDE,
      });

      return mapStoreToResponse(updated);
    });
  }
}

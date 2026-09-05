import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { AddressOwnershipProvider } from './address-ownership.provider';
import {
  AddressResponse,
  mapAddressToResponse,
} from '../utils/map-address.util';

@Injectable()
export class UpdateAddressProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: AddressOwnershipProvider,
  ) {}

  public async update(
    userId: number,
    id: number,
    dto: UpdateAddressDto,
  ): Promise<AddressResponse> {
    await this.ownership.getOwnedOrThrow(id, userId);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefaultShipping === true) {
        await tx.userAddress.updateMany({
          where: { userId, isDefaultShipping: true, NOT: { id } },
          data: { isDefaultShipping: false },
        });
      }
      if (dto.isDefaultBilling === true) {
        await tx.userAddress.updateMany({
          where: { userId, isDefaultBilling: true, NOT: { id } },
          data: { isDefaultBilling: false },
        });
      }

      return tx.userAddress.update({
        where: { id },
        data: {
          ...(dto.label !== undefined
            ? { label: dto.label?.trim() || null }
            : {}),
          ...(dto.fullName !== undefined
            ? { fullName: dto.fullName.trim() }
            : {}),
          ...(dto.line1 !== undefined ? { line1: dto.line1.trim() } : {}),
          ...(dto.line2 !== undefined
            ? { line2: dto.line2?.trim() || null }
            : {}),
          ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
          ...(dto.region !== undefined ? { region: dto.region.trim() } : {}),
          ...(dto.postalCode !== undefined
            ? { postalCode: dto.postalCode.trim() }
            : {}),
          ...(dto.country !== undefined ? { country: dto.country.trim() } : {}),
          ...(dto.phone !== undefined
            ? { phone: dto.phone?.trim() || null }
            : {}),
          ...(dto.isDefaultShipping !== undefined
            ? { isDefaultShipping: dto.isDefaultShipping }
            : {}),
          ...(dto.isDefaultBilling !== undefined
            ? { isDefaultBilling: dto.isDefaultBilling }
            : {}),
        },
      });
    });

    return mapAddressToResponse(updated);
  }
}

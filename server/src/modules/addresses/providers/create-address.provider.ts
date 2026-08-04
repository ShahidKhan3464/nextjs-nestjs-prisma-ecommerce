import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAddressDto } from '../dto/create-address.dto';
import {
  AddressResponse,
  mapAddressToResponse,
} from '../utils/map-address.util';

@Injectable()
export class CreateAddressProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async create(
    userId: number,
    dto: CreateAddressDto,
  ): Promise<AddressResponse> {
    const existingCount = await this.prisma.userAddress.count({
      where: { userId },
    });

    const makeDefaultShipping =
      dto.isDefaultShipping === true || existingCount === 0;
    const makeDefaultBilling =
      dto.isDefaultBilling === true || existingCount === 0;

    const created = await this.prisma.$transaction(async (tx) => {
      if (makeDefaultShipping) {
        await tx.userAddress.updateMany({
          where: { userId, isDefaultShipping: true },
          data: { isDefaultShipping: false },
        });
      }
      if (makeDefaultBilling) {
        await tx.userAddress.updateMany({
          where: { userId, isDefaultBilling: true },
          data: { isDefaultBilling: false },
        });
      }

      return tx.userAddress.create({
        data: {
          userId,
          city: dto.city.trim(),
          line1: dto.line1.trim(),
          region: dto.region.trim(),
          country: dto.country.trim(),
          fullName: dto.fullName.trim(),
          line2: dto.line2?.trim() || null,
          phone: dto.phone?.trim() || null,
          label: dto.label?.trim() || null,
          postalCode: dto.postalCode.trim(),
          isDefaultBilling: makeDefaultBilling,
          isDefaultShipping: makeDefaultShipping,
        },
      });
    });

    return mapAddressToResponse(created);
  }
}

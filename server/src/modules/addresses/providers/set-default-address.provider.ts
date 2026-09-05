import { PrismaService } from 'src/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { SetDefaultAddressDto } from '../dto/set-default-address.dto';
import { AddressOwnershipProvider } from './address-ownership.provider';
import {
  AddressResponse,
  mapAddressToResponse,
} from '../utils/map-address.util';

@Injectable()
export class SetDefaultAddressProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: AddressOwnershipProvider,
  ) {}

  public async setDefault(
    userId: number,
    id: number,
    dto: SetDefaultAddressDto,
  ): Promise<AddressResponse> {
    const setShipping = dto.shipping === true;
    const setBilling = dto.billing === true;

    if (!setShipping && !setBilling) {
      throw new BadRequestException(
        'Specify shipping and/or billing to mark as default',
      );
    }

    await this.ownership.getOwnedOrThrow(id, userId);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (setShipping) {
        await tx.userAddress.updateMany({
          where: { userId, isDefaultShipping: true, NOT: { id } },
          data: { isDefaultShipping: false },
        });
      }
      if (setBilling) {
        await tx.userAddress.updateMany({
          where: { userId, isDefaultBilling: true, NOT: { id } },
          data: { isDefaultBilling: false },
        });
      }

      return tx.userAddress.update({
        where: { id },
        data: {
          ...(setShipping ? { isDefaultShipping: true } : {}),
          ...(setBilling ? { isDefaultBilling: true } : {}),
        },
      });
    });

    return mapAddressToResponse(updated);
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddressOwnershipProvider } from './address-ownership.provider';

@Injectable()
export class DeleteAddressProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: AddressOwnershipProvider,
  ) {}

  public async delete(userId: number, id: number): Promise<{ deleted: true }> {
    const existing = await this.ownership.getOwnedOrThrow(id, userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.userAddress.delete({ where: { id } });

      if (existing.isDefaultShipping) {
        const nextShipping = await tx.userAddress.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        if (nextShipping) {
          await tx.userAddress.update({
            where: { id: nextShipping.id },
            data: { isDefaultShipping: true },
          });
        }
      }

      if (existing.isDefaultBilling) {
        const nextBilling = await tx.userAddress.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        if (nextBilling) {
          await tx.userAddress.update({
            where: { id: nextBilling.id },
            data: { isDefaultBilling: true },
          });
        }
      }
    });

    return { deleted: true };
  }
}

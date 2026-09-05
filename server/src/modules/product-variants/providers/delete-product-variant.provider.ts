import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Injectable, BadRequestException } from '@nestjs/common';
import { VariantOwnershipProvider } from './variant-ownership.provider';

@Injectable()
export class DeleteProductVariantProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly variantOwnershipProvider: VariantOwnershipProvider,
  ) {}

  public async remove(
    id: number,
    userId: number,
    roles: UserRole[],
  ): Promise<void> {
    await this.variantOwnershipProvider.assertCanManageVariant(
      id,
      userId,
      roles,
    );

    await this.prisma.$transaction(async (tx) => {
      const orderRef = await tx.orderItem.findFirst({
        where: { variantId: id },
        select: { id: true },
      });

      if (orderRef) {
        throw new BadRequestException(
          'Cannot delete this variant because it is referenced by existing orders',
        );
      }

      const checkoutRef = await tx.checkoutSessionItem.findFirst({
        where: { variantId: id },
        select: { id: true },
      });

      if (checkoutRef) {
        throw new BadRequestException(
          'Cannot delete this variant because it is referenced by an active checkout session',
        );
      }

      // Cart items cascade-delete via FK; orders/checkout remain Restrict.
      await tx.productVariant.delete({ where: { id } });
    });
  }
}

import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { PaymentWithOrder } from '../utils/map-payment.util';
import { isSuperAdmin, hasAnyRole } from 'src/common/utils/authorization.util';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class PaymentOwnershipProvider {
  constructor(private readonly prisma: PrismaService) {}

  public async findOwnedStoreId(userId: number): Promise<number | null> {
    const store = await this.prisma.store.findFirst({
      where: {
        deletedAt: null,
        sellerProfile: { userId, deletedAt: null },
      },
      select: { id: true },
    });
    return store?.id ?? null;
  }

  public async findOwnedStoreOrThrow(userId: number) {
    const store = await this.prisma.store.findFirst({
      where: {
        deletedAt: null,
        sellerProfile: { userId, deletedAt: null },
      },
      select: { id: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found for this seller');
    }

    return store;
  }

  /**
   * Buyer may view own order payments; seller may view payments for their store;
   * SUPER_ADMIN may view any payment.
   */
  public assertCanView(
    payment: PaymentWithOrder,
    userId: number,
    roles: UserRole[],
    ownedStoreId?: number | null,
  ): void {
    if (isSuperAdmin(roles)) {
      return;
    }

    if (!payment.order) {
      throw new ForbiddenException('You do not have access to this payment');
    }

    if (payment.order.userId === userId) {
      return;
    }

    if (
      hasAnyRole(roles, [UserRole.SELLER]) &&
      ownedStoreId !== undefined &&
      ownedStoreId !== null &&
      payment.order.storeId === ownedStoreId
    ) {
      return;
    }

    throw new ForbiddenException('You do not have access to this payment');
  }

  /** Seller (owns store) or SUPER_ADMIN may confirm/reject COD. */
  public assertCanManageCod(
    payment: PaymentWithOrder,
    userId: number,
    roles: UserRole[],
    ownedStoreId?: number | null,
  ): void {
    if (isSuperAdmin(roles)) {
      return;
    }

    if (
      hasAnyRole(roles, [UserRole.SELLER]) &&
      payment.order &&
      ownedStoreId !== undefined &&
      ownedStoreId !== null &&
      payment.order.storeId === ownedStoreId
    ) {
      return;
    }

    throw new ForbiddenException(
      'You do not have permission to manage this COD payment',
    );
  }

  public assertCanRecordRefund(roles: UserRole[]): void {
    if (isSuperAdmin(roles)) {
      return;
    }

    throw new ForbiddenException(
      'Only administrators may record payment refunds',
    );
  }
}

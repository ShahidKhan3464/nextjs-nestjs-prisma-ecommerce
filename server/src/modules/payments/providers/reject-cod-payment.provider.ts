import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { AuditProvider } from 'src/common/audit/audit.provider';
import { findPaymentWithOrder } from '../utils/payment-query.util';
import { PaymentOwnershipProvider } from './payment-ownership.provider';
import { PaymentLifecycleProvider } from './payment-lifecycle.provider';
import { OrderStatus } from 'src/modules/orders/constants/order.constants';
import { AuditAction, AuditEntityType } from 'src/common/audit/audit.constants';
import { adjustVariantStock } from 'src/modules/orders/utils/adjust-variant-stock.util';
import {
  PaymentStatus,
  PaymentProvider,
  PaymentFailureReason,
} from '../constants/payment.constants';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  PaymentResponse,
  mapPaymentToResponse,
} from '../utils/map-payment.util';

@Injectable()
export class RejectCodPaymentProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditProvider: AuditProvider,
    private readonly paymentOwnershipProvider: PaymentOwnershipProvider,
    private readonly paymentLifecycleProvider: PaymentLifecycleProvider,
  ) {}

  async reject(
    paymentId: number,
    userId: number,
    roles: UserRole[],
    reason?: string,
  ): Promise<PaymentResponse> {
    const payment = await findPaymentWithOrder(this.prisma, { id: paymentId });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.provider !== PaymentProvider.COD) {
      throw new BadRequestException(
        'Only COD payments can be rejected this way',
      );
    }

    const ownedStoreId =
      await this.paymentOwnershipProvider.findOwnedStoreId(userId);

    this.paymentOwnershipProvider.assertCanManageCod(
      payment,
      userId,
      roles,
      ownedStoreId,
    );

    if (payment.status === PaymentStatus.FAILED) {
      return mapPaymentToResponse(payment);
    }

    const failureReason = reason?.trim() || PaymentFailureReason.COD_REJECTED;

    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: {
          id: payment.orderId,
          status: OrderStatus.PENDING,
        },
        data: {
          status: OrderStatus.CANCELLED,
          cancellationReason: failureReason,
          cancelledAt: new Date(),
        },
      });

      if (claimed.count > 0) {
        const items = await tx.orderItem.findMany({
          where: { orderId: payment.orderId },
          select: { variantId: true, quantity: true },
        });
        await adjustVariantStock(tx, items, 'release');
      }

      await this.paymentLifecycleProvider.markFailedMany(tx, {
        paymentIds: [payment.id],
        failureReason,
      });
    });

    this.auditProvider.record({
      action: AuditAction.PAYMENT_COD_REJECTED,
      entityType: AuditEntityType.PAYMENT,
      entityId: paymentId,
      before: { status: payment.status },
      after: { status: PaymentStatus.FAILED, failureReason },
    });

    const updated = await findPaymentWithOrder(this.prisma, { id: paymentId });
    if (!updated) {
      throw new NotFoundException('Payment not found');
    }

    return mapPaymentToResponse(updated);
  }
}

import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { findPaymentWithOrder } from '../utils/payment-query.util';
import { PaymentOwnershipProvider } from './payment-ownership.provider';
import { PaymentLifecycleProvider } from './payment-lifecycle.provider';
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
      await this.paymentLifecycleProvider.markFailedMany(tx, {
        paymentIds: [payment.id],
        failureReason,
      });
    });

    const updated = await findPaymentWithOrder(this.prisma, { id: paymentId });
    if (!updated) {
      throw new NotFoundException('Payment not found');
    }

    return mapPaymentToResponse(updated);
  }
}

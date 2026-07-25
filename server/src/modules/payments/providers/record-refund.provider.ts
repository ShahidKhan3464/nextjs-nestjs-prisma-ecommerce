import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { RecordRefundDto } from '../dto/record-refund.dto';
import { findPaymentWithOrder } from '../utils/payment-query.util';
import { PaymentOwnershipProvider } from './payment-ownership.provider';
import { PaymentLifecycleProvider } from './payment-lifecycle.provider';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  PaymentResponse,
  mapPaymentToResponse,
} from '../utils/map-payment.util';

/**
 * Tracks full/partial refunds on the Payment record.
 * Does not call Stripe — existing refund APIs remain the source of provider refunds.
 */
@Injectable()
export class RecordRefundProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentOwnershipProvider: PaymentOwnershipProvider,
    private readonly paymentLifecycleProvider: PaymentLifecycleProvider,
  ) {}

  async record(
    paymentId: number,
    roles: UserRole[],
    dto: RecordRefundDto,
  ): Promise<PaymentResponse> {
    this.paymentOwnershipProvider.assertCanRecordRefund(roles);

    const payment = await findPaymentWithOrder(this.prisma, { id: paymentId });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const remaining =
      Math.round((payment.amount - payment.refundedAmount) * 100) / 100;

    if (remaining <= 0) {
      throw new BadRequestException('Payment is already fully refunded');
    }

    const refundAmount =
      dto.amount !== undefined ? Math.round(dto.amount * 100) / 100 : remaining;

    await this.prisma.$transaction(async (tx) => {
      await this.paymentLifecycleProvider.applyRefund(tx, {
        paymentId,
        amount: refundAmount,
        reason: dto.reason.trim(),
        externalRefundId: dto.externalRefundId?.trim() || null,
      });
    });

    const updated = await findPaymentWithOrder(this.prisma, { id: paymentId });
    if (!updated) {
      throw new NotFoundException('Payment not found');
    }

    return mapPaymentToResponse(updated);
  }
}

import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { findPaymentWithOrder } from '../utils/payment-query.util';
import { PaymentOwnershipProvider } from './payment-ownership.provider';
import { PaymentLifecycleProvider } from './payment-lifecycle.provider';
import { PaymentProvider, PaymentStatus } from '../constants/payment.constants';
import { getPaymentProviderCapabilities } from '../utils/payment-provider.registry';
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
export class ConfirmCodPaymentProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentOwnershipProvider: PaymentOwnershipProvider,
    private readonly paymentLifecycleProvider: PaymentLifecycleProvider,
  ) {}

  async confirm(
    paymentId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<PaymentResponse> {
    const payment = await findPaymentWithOrder(this.prisma, { id: paymentId });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.provider !== PaymentProvider.COD) {
      throw new BadRequestException(
        'Only COD payments can be confirmed this way',
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

    if (
      payment.status !== PaymentStatus.PENDING &&
      payment.status !== PaymentStatus.PROCESSING
    ) {
      if (payment.status === PaymentStatus.SUCCEEDED) {
        return mapPaymentToResponse(payment);
      }
      throw new BadRequestException(
        `COD payment cannot be confirmed from status ${payment.status}`,
      );
    }

    const capabilities = getPaymentProviderCapabilities(PaymentProvider.COD);

    await this.prisma.$transaction(async (tx) => {
      await this.paymentLifecycleProvider.markSucceededMany(tx, {
        orderIds: [payment.orderId],
        methodSummary:
          payment.methodSummary ?? capabilities.defaultMethodSummary,
      });
    });

    const updated = await findPaymentWithOrder(this.prisma, { id: paymentId });
    if (!updated) {
      throw new NotFoundException('Payment not found');
    }

    return mapPaymentToResponse(updated);
  }
}

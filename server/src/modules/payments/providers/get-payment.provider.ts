import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Injectable, NotFoundException } from '@nestjs/common';
import { findPaymentWithOrder } from '../utils/payment-query.util';
import { PaymentOwnershipProvider } from './payment-ownership.provider';
import {
  PaymentResponse,
  mapPaymentToResponse,
} from '../utils/map-payment.util';

@Injectable()
export class GetPaymentProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentOwnershipProvider: PaymentOwnershipProvider,
  ) {}

  async findOne(
    paymentId: number,
    userId: number,
    roles: UserRole[],
  ): Promise<PaymentResponse> {
    const payment = await findPaymentWithOrder(this.prisma, { id: paymentId });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const ownedStoreId =
      await this.paymentOwnershipProvider.findOwnedStoreId(userId);

    this.paymentOwnershipProvider.assertCanView(
      payment,
      userId,
      roles,
      ownedStoreId,
    );

    return mapPaymentToResponse(payment);
  }
}

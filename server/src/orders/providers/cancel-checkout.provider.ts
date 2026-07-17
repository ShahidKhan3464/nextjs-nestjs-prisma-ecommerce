import { PrismaService } from 'src/prisma/prisma.service';
import {
  OrderStatus,
  PaymentStatus,
  CheckoutSessionStatus,
} from '../constants/order.constants';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class CancelCheckoutProvider {
  constructor(private readonly prisma: PrismaService) {}

  async cancel(paymentIntentId: string, userId: number): Promise<void> {
    const session = await this.prisma.checkoutSession.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
        status: CheckoutSessionStatus.PENDING,
      },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException();
    }

    await this.prisma.$transaction(async (tx) => {
      const payments = await tx.payment.findMany({
        where: {
          transactionId: paymentIntentId,
          status: PaymentStatus.PENDING,
          order: { userId, status: OrderStatus.PENDING },
        },
        select: { orderId: true },
      });

      const orderIds = payments.map((payment) => payment.orderId);
      if (orderIds.length > 0) {
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }

      const updated = await tx.checkoutSession.updateMany({
        where: {
          id: session.id,
          status: CheckoutSessionStatus.PENDING,
        },
        data: { status: CheckoutSessionStatus.CANCELLED },
      });

      if (updated.count === 0) {
        throw new BadRequestException('Checkout session is no longer pending');
      }
    });
  }
}

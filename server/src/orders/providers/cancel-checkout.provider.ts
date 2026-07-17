import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '../constants/order.constants';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class CancelCheckoutProvider {
  constructor(private readonly prisma: PrismaService) {}

  async cancel(paymentIntentId: string, userId: number): Promise<void> {
    const session = await this.prisma.checkoutSession.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
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

      await tx.checkoutSession.delete({ where: { id: session.id } });
    });
  }
}

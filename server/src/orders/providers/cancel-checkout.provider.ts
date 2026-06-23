import { PrismaService } from 'src/prisma/prisma.service';
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

    await this.prisma.checkoutSession.delete({ where: { id: session.id } });
  }
}

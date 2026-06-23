import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CheckoutSession } from '../entities/checkout-session.entity';
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class CancelCheckoutProvider {
  constructor(
    @InjectRepository(CheckoutSession)
    private readonly sessionRepository: Repository<CheckoutSession>,
  ) {}

  async cancel(paymentIntentId: string, userId: number): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException();
    }

    await this.sessionRepository.remove(session);
  }
}

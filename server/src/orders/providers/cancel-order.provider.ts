import Stripe from 'stripe';
import type { ConfigType } from '@nestjs/config';
import stripeConfig from 'src/config/stripe.config';
import type { Stripe as StripeTypes } from 'stripe';
import { UsersService } from 'src/users/users.service';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/users/constants/user.constants';
import { MailService } from 'src/mail/providers/mail.service';
import { findOrderWithImages } from 'src/common/files/file-query.util';
import { OrderStatus, PaymentStatus } from '../constants/order.constants';
import { OrderResponse, mapOrderToResponse } from '../utils/map-order.util';
import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class CancelOrderProvider {
  private stripe: StripeTypes;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    @Inject(stripeConfig.KEY)
    private readonly stripeConfiguration: ConfigType<typeof stripeConfig>,
  ) {
    const secretKey = this.stripeConfiguration.secretKey;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(secretKey);
  }

  async cancel(
    orderId: number,
    userId: number,
    dto: CancelOrderDto,
  ): Promise<OrderResponse> {
    const order = await findOrderWithImages(this.prisma, { id: orderId });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const user = await this.usersService.findOneById(userId);
    const isAdmin = user?.role === UserRole.ADMIN;

    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException();
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    if (
      order.paymentStatus === PaymentStatus.PAID &&
      order.stripePaymentIntentId
    ) {
      await this.stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      const lockedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (
        !lockedOrder ||
        (lockedOrder.status as OrderStatus) !== OrderStatus.PENDING
      ) {
        throw new BadRequestException('Only pending orders can be cancelled');
      }

      for (const item of lockedOrder.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });
        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: variant.stock + item.quantity },
          });
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: PaymentStatus.REFUNDED,
          cancellationReason: dto.reason.trim(),
          cancelledAt: new Date(),
        },
      });
    });

    const updated = await findOrderWithImages(this.prisma, { id: orderId });
    if (!updated) {
      throw new NotFoundException('Order not found');
    }

    const response = mapOrderToResponse(updated);

    const customer = await this.usersService.findOneById(updated.userId);
    if (customer?.email) {
      void this.mailService
        .sendOrderStatusUpdateEmail(
          customer.email,
          customer.fullName,
          response,
          OrderStatus.CANCELLED,
        )
        .catch(() => undefined);
    }

    return response;
  }
}

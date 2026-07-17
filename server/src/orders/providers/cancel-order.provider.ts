import Stripe from 'stripe';
import type { ConfigType } from '@nestjs/config';
import stripeConfig from 'src/config/stripe.config';
import type { Stripe as StripeTypes } from 'stripe';
import { UsersService } from 'src/users/users.service';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from 'src/common/enums/user-role.enum';
import { MailService } from 'src/mail/providers/mail.service';
import { OrderOwnershipProvider } from './order-ownership.provider';
import { findOrderWithImages } from 'src/common/files/file-query.util';
import { OrderStatus, PaymentStatus } from '../constants/order.constants';
import { OrderResponse, mapOrderToResponse } from '../utils/map-order.util';
import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class CancelOrderProvider {
  private stripe: StripeTypes;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
    private readonly orderOwnershipProvider: OrderOwnershipProvider,
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
    roles: UserRole[],
    dto: CancelOrderDto,
  ): Promise<OrderResponse> {
    const order = await findOrderWithImages(this.prisma, { id: orderId });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    this.orderOwnershipProvider.assertCanCancel(order, userId, roles);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    const payment = order.payment;
    const wasPaid = payment?.status === PaymentStatus.SUCCEEDED;

    if (wasPaid && payment?.transactionId) {
      await this.stripe.refunds.create({
        payment_intent: payment.transactionId,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      const lockedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payment: true },
      });

      if (
        !lockedOrder ||
        (lockedOrder.status as OrderStatus) !== OrderStatus.PENDING
      ) {
        throw new BadRequestException('Only pending orders can be cancelled');
      }

      // Stock is deducted only after successful payment.
      if (lockedOrder.payment?.status === PaymentStatus.SUCCEEDED || wasPaid) {
        for (const item of lockedOrder.items) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });
          if (variant) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                stockQuantity: variant.stockQuantity + item.quantity,
              },
            });
          }
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancellationReason: dto.reason.trim(),
          cancelledAt: new Date(),
        },
      });

      if (lockedOrder.payment) {
        await tx.payment.update({
          where: { id: lockedOrder.payment.id },
          data: {
            status: wasPaid ? PaymentStatus.REFUNDED : PaymentStatus.FAILED,
          },
        });
      }
    });

    const updated = await findOrderWithImages(this.prisma, { id: orderId });
    if (!updated) {
      throw new NotFoundException('Order not found');
    }

    const response = mapOrderToResponse(updated, {
      includeBuyer: this.orderOwnershipProvider.shouldIncludeBuyer(roles),
    });

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

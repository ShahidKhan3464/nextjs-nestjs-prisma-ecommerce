import Stripe from 'stripe';
import type { ConfigType } from '@nestjs/config';
import stripeConfig from 'src/config/stripe.config';
import type { Stripe as StripeTypes } from 'stripe';
import { UsersService } from 'src/users/users.service';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/providers/mail.service';
import { findOrderWithImages } from 'src/common/files/file-query.util';
import { OrderStatus, PaymentStatus } from '../constants/order.constants';
import { OrderResponse, mapOrderToResponse } from '../utils/map-order.util';
import {
  isSuperAdmin,
  extractUserRoles,
} from 'src/common/utils/authorization.util';
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

    const user = await this.usersService.findOneByIdWithRoles(userId);
    const isAdmin = user ? isSuperAdmin(extractUserRoles(user)) : false;

    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException();
    }

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

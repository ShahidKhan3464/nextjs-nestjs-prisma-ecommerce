import Stripe from 'stripe';
import type { ConfigType } from '@nestjs/config';
import { Order } from '../entities/order.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import stripeConfig from 'src/config/stripe.config';
import type { Stripe as StripeTypes } from 'stripe';
import { UsersService } from 'src/users/users.service';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { UserRole } from 'src/users/constants/user.constants';
import { MailService } from 'src/mail/providers/mail.service';
import { joinProductImages } from 'src/common/files/file-query.util';
import { OrderStatus, PaymentStatus } from '../constants/order.constants';
import { OrderResponse, mapOrderToResponse } from '../utils/map-order.util';
import { ProductVariant } from 'src/products/entities/product-variant.entity';
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
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
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
    const order = await joinProductImages(
      this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.variant', 'variant')
        .leftJoinAndSelect('variant.product', 'product')
        .withDeleted()
        .where('order.id = :orderId', { orderId }),
      'product',
    ).getOne();

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

    await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const variantRepo = manager.getRepository(ProductVariant);

      const lockedOrder = await orderRepo.findOne({
        where: { id: orderId },
        relations: ['items'],
      });

      if (!lockedOrder || lockedOrder.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Only pending orders can be cancelled');
      }

      for (const item of lockedOrder.items) {
        const variant = await variantRepo.findOne({
          where: { id: item.variantId },
        });
        if (variant) {
          variant.stock += item.quantity;
          await variantRepo.save(variant);
        }
      }

      lockedOrder.status = OrderStatus.CANCELLED;
      lockedOrder.paymentStatus = PaymentStatus.REFUNDED;
      lockedOrder.cancellationReason = dto.reason.trim();
      lockedOrder.cancelledAt = new Date();
      await orderRepo.save(lockedOrder);
    });

    const updated = await joinProductImages(
      this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.items', 'items')
        .leftJoinAndSelect('items.variant', 'variant')
        .leftJoinAndSelect('variant.product', 'product')
        .withDeleted()
        .where('order.id = :orderId', { orderId }),
      'product',
    ).getOneOrFail();

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

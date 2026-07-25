import { Injectable } from '@nestjs/common';
import { QueryOrderDto } from './dto/query-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CancelCheckoutDto } from './dto/cancel-checkout.dto';
import { CompleteCheckoutDto } from './dto/complete-checkout.dto';
import { GetOrderProvider } from './providers/get-order.provider';
import { GetOrdersProvider } from './providers/get-orders.provider';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderProvider } from './providers/cancel-order.provider';
import { StripeWebhookProvider } from './providers/stripe-webhook.provider';
import { CreateCheckoutProvider } from './providers/create-checkout.provider';
import { CancelCheckoutProvider } from './providers/cancel-checkout.provider';
import { CompleteCheckoutProvider } from './providers/complete-checkout.provider';
import { UpdateOrderStatusProvider } from './providers/update-order-status.provider';

@Injectable()
export class OrdersService {
  constructor(
    private readonly getOrderProvider: GetOrderProvider,
    private readonly getOrdersProvider: GetOrdersProvider,
    private readonly cancelOrderProvider: CancelOrderProvider,
    private readonly stripeWebhookProvider: StripeWebhookProvider,
    private readonly createCheckoutProvider: CreateCheckoutProvider,
    private readonly cancelCheckoutProvider: CancelCheckoutProvider,
    private readonly completeCheckoutProvider: CompleteCheckoutProvider,
    private readonly updateOrderStatusProvider: UpdateOrderStatusProvider,
  ) {}

  findMine(userId: number, query: QueryOrderDto) {
    return this.getOrdersProvider.findByUser(userId, query);
  }

  findSellerOrders(userId: number, query: QueryOrderDto) {
    return this.getOrdersProvider.findBySeller(userId, query);
  }

  findAllAdmin(query: QueryOrderDto) {
    return this.getOrdersProvider.findAll(query);
  }

  findOne(orderId: number, userId: number, roles: UserRole[]) {
    return this.getOrderProvider.findOne(orderId, userId, roles);
  }

  createCheckout(userId: number, dto: CreateCheckoutDto) {
    return this.createCheckoutProvider.create(userId, dto);
  }

  cancelCheckout(userId: number, dto: CancelCheckoutDto) {
    return this.cancelCheckoutProvider.cancel(dto.paymentIntentId, userId);
  }

  completeCheckout(userId: number, dto: CompleteCheckoutDto) {
    return this.completeCheckoutProvider.complete(userId, dto);
  }

  handleStripeWebhook(rawBody: Buffer, signature: string | undefined) {
    return this.stripeWebhookProvider.handle(rawBody, signature);
  }

  updateStatus(
    orderId: number,
    dto: UpdateOrderStatusDto,
    userId: number,
    roles: UserRole[],
  ) {
    return this.updateOrderStatusProvider.update(
      orderId,
      dto.status,
      userId,
      roles,
    );
  }

  cancelOrder(
    orderId: number,
    userId: number,
    roles: UserRole[],
    dto: CancelOrderDto,
  ) {
    return this.cancelOrderProvider.cancel(orderId, userId, roles, dto);
  }
}
